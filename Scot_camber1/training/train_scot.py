#!/usr/bin/env python3
"""
SCOT AI - YOLOv11 Training Engine
Specialized training pipeline for Sports Object Detection (ball, players, net, referee)
and Multi-Person Pose Estimation (17 keypoints for spike, jump, and setter mechanics).
Optimized for Colab Pro & Camber GPU cluster environments.
"""

import argparse
import json
import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict
import torch 
from ultralytics import YOLO 

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("scot_trainer")

DEFAULT_DATA_YAML = "./dataset/volleyball_yolov11/data.yaml"


def check_hardware() -> str:
    """Verifies GPU acceleration and returns appropriate device string."""
    if torch.cuda.is_available():
        gpu_count = torch.cuda.device_count()
        gpu_name = torch.cuda.get_device_name(0)
        vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
        logger.info(f"Hardware Verified: {gpu_count}x CUDA GPU ({gpu_name}, {vram_gb:.1f} GB VRAM)")
        return "0"
    else:
        logger.warning("No CUDA GPU detected! Falling back to CPU training (slow).")
        return "cpu"


def train_model(
    task: str = "detect",
    data_yaml: str = DEFAULT_DATA_YAML,
    weights: str = None,
    imgsz: int = 640,
    batch: int = 32,
    epochs: int = 60,
    patience: int = 15,
    freeze: int = 10,
    cos_lr: bool = True,
    mosaic: float = 1.0,
    lr0: float = None,
    resume: bool = False,
    project: str = "./runs/scot_train",
    name: str = None,
    device: str = None,
) -> Dict[str, Any]:
    """
    Executes fine-tuning or resumed training of YOLO detection or pose estimation model.
    """
    selected_device = device or check_hardware()

    # Determine default pretrained weights based on task
    if weights is None:
        if task == "pose":
            weights = "yolo11s-pose.pt"
            run_name = name or "scot_v11s_pose_volleyball"
        else:
            weights = "yolo11s.pt"
            run_name = name or "scot_v11s_detect_volleyball"
    else:
        run_name = name or f"scot_custom_{task}"

    logger.info("=" * 70)
    logger.info("SCOT AI YOLOV11 / CUSTOM TRAINING SESSION")
    logger.info(f"Task Mode           : {task.upper()}")
    logger.info(f"Initial Weights     : {weights}")
    logger.info(f"Dataset Config      : {data_yaml}")
    logger.info(f"Image Size          : {imgsz}x{imgsz}")
    logger.info(f"Batch Size          : {batch}")
    logger.info(f"Total Epochs        : {epochs} (Patience: {patience})")
    logger.info(f"Backbone Freeze     : First {freeze} layers")
    logger.info(f"Cosine LR Scheduler : {cos_lr}")
    logger.info(f"Mosaic Augmentation : {mosaic} (crucial for small fast balls)")
    logger.info(f"Strict Resume Mode  : {resume}")
    if lr0:
        logger.info(f"Initial LR (lr0)    : {lr0}")
    logger.info(f"Device Target       : {selected_device}")
    logger.info("=" * 70)

    # Initialize Ultralytics YOLO model
    model = YOLO(weights)

    train_kwargs = dict(
        data=data_yaml,
        epochs=epochs,
        patience=patience,
        batch=batch,
        imgsz=imgsz,
        freeze=freeze if not resume else None,
        cos_lr=cos_lr,
        mosaic=mosaic,
        device=selected_device,
        project=project,
        name=run_name,
        save=True,
        save_period=10,
        plots=True,
        workers=8 if selected_device != "cpu" else 2,
        exist_ok=True,
        verbose=True,
    )
    if lr0 is not None:
        train_kwargs["lr0"] = lr0
    if resume:
        train_kwargs["resume"] = True

    # Launch model training
    train_results = model.train(**train_kwargs)

    best_checkpoint_path = Path(project) / run_name / "weights" / "best.pt"
    logger.info(f"Training completed. Best model checkpoint saved to: {best_checkpoint_path}")

    # Automated Validation Evaluation on Best Checkpoint
    logger.info("Evaluating best model weights on validation split...")
    best_model = YOLO(str(best_checkpoint_path))
    val_results = best_model.val(data=data_yaml, split="val", imgsz=imgsz, device=selected_device)

    # Extract standard metrics
    metrics_summary = {}
    try:
        box_metrics = getattr(val_results, "box", None)
        if box_metrics:
            precision = float(box_metrics.mp) if hasattr(box_metrics, "mp") else 0.0
            recall = float(box_metrics.mr) if hasattr(box_metrics, "mr") else 0.0
            map50 = float(box_metrics.map50) if hasattr(box_metrics, "map50") else 0.0
            map50_95 = float(box_metrics.map) if hasattr(box_metrics, "map") else 0.0

            metrics_summary = {
                "task": task,
                "precision": round(precision, 4),
                "recall": round(recall, 4),
                "mAP_50": round(map50, 4),
                "mAP_50_95": round(map50_95, 4),
                "best_checkpoint": str(best_checkpoint_path.resolve()),
            }

            logger.info("=" * 70)
            logger.info("FINAL VALIDATION METRICS (Best Checkpoint):")
            logger.info(f"  Precision    : {precision:.4f} ({precision * 100:.1f}%)")
            logger.info(f"  Recall       : {recall:.4f} ({recall * 100:.1f}%)")
            logger.info(f"  mAP @ 0.50   : {map50:.4f} ({map50 * 100:.1f}%)")
            logger.info(f"  mAP @ 50-95  : {map50_95:.4f} ({map50_95 * 100:.1f}%)")
            logger.info("=" * 70)

        # In pose task, also log pose keypoint metrics
        pose_metrics = getattr(val_results, "pose", None)
        if pose_metrics:
            metrics_summary["pose_mAP_50"] = round(float(pose_metrics.map50), 4)
            metrics_summary["pose_mAP_50_95"] = round(float(pose_metrics.map), 4)
            logger.info(f"  Pose Keypoint mAP @ 0.50  : {metrics_summary['pose_mAP_50']:.4f}")
            logger.info(f"  Pose Keypoint mAP @ 50-95 : {metrics_summary['pose_mAP_50_95']:.4f}")

    except Exception as eval_err:
        logger.warning(f"Failed to fully parse validation metrics: {eval_err}")
        metrics_summary["raw"] = str(val_results)

    # Save metrics JSON to run directory
    metrics_path = Path(project) / run_name / "evaluation_summary.json"
    with open(metrics_path, "w", encoding="utf-8") as jf:
        json.dump(metrics_summary, jf, indent=2)

    logger.info(f"Metrics record written to: {metrics_path}")
    return metrics_summary


def parse_args():
    parser = argparse.ArgumentParser(description="SCOT AI YOLOv11 Multi-Sport Trainer")
    parser.add_argument("--task", "-t", type=str, default="detect", choices=["detect", "pose"], help="Training task")
    parser.add_argument("--data", "-d", type=str, default=DEFAULT_DATA_YAML, help="Path to data.yaml")
    parser.add_argument("--weights", "-w", type=str, default=None, help="Initial weights (defaults to yolo11s.pt or yolo11s-pose.pt)")
    parser.add_argument("--imgsz", type=int, default=640, help="Input image dimension")
    parser.add_argument("--batch", "-b", type=int, default=32, help="Batch size per step")
    parser.add_argument("--epochs", "-e", type=int, default=60, help="Total training epochs")
    parser.add_argument("--patience", "-p", type=int, default=15, help="Early stopping patience")
    parser.add_argument("--freeze", type=int, default=10, help="Number of backbone layers to freeze")
    parser.add_argument("--no_cos_lr", action="store_true", help="Disable cosine learning rate scheduler")
    parser.add_argument("--mosaic", type=float, default=1.0, help="Mosaic augmentation probability")
    parser.add_argument("--project", type=str, default="./runs/scot_train", help="Destination project directory")
    parser.add_argument("--name", "-n", type=str, default=None, help="Sub-run directory name")
    parser.add_argument("--device", type=str, default=None, help="CUDA device index e.g. 0 or cpu")
    parser.add_argument("--lr0", type=float, default=None, help="Initial learning rate for fine-tuning")
    parser.add_argument("--resume", action="store_true", help="Resume training from checkpoint")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    train_model(
        task=args.task,
        data_yaml=args.data,
        weights=args.weights,
        imgsz=args.imgsz,
        batch=args.batch,
        epochs=args.epochs,
        patience=args.patience,
        freeze=args.freeze,
        cos_lr=not args.no_cos_lr,
        mosaic=args.mosaic,
        lr0=args.lr0,
        resume=args.resume,
        project=args.project,
        name=args.name,
        device=args.device,
    )

