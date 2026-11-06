#!/usr/bin/env python3
"""
SCOT AI - Roboflow Dataset Downloader
Authenticates and downloads pre-annotated sports computer vision datasets
in YOLOv11 format with automated failover and validation.
"""

import argparse
import logging
import os
import sys
from pathlib import Path
from typing import Optional

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("scot_downloader")

# Pre-curated datasets for Scot AI Volleyball Action & Ball Tracking
PRIMARY_DATASET_WORKSPACE = "cv-ouhxm"
PRIMARY_DATASET_PROJECT = "volleyball-actions-bg8ht"
PRIMARY_DATASET_VERSION = 1

FALLBACK_DATASET_WORKSPACE = "qc"
FALLBACK_DATASET_PROJECT = "volleyball-hwxp2"
FALLBACK_DATASET_VERSION = 2

DEFAULT_API_KEY_PLACEHOLDER = "PASTE_YOUR_KEY_HERE"


def download_volleyball_dataset(
    api_key: Optional[str] = None,
    output_dir: str = "./dataset/volleyball_yolov11",
    model_format: str = "yolov11",
    use_fallback: bool = False,
    workspace: Optional[str] = None,
    project: Optional[str] = None,
    version: Optional[int] = None,
) -> Path:
    """
    Downloads volleyball dataset using Roboflow SDK with automatic fallback or custom project.
    """
    resolved_key = (
        api_key
        or os.getenv("ROBOFLOW_API_KEY")
        or DEFAULT_API_KEY_PLACEHOLDER
    )

    if resolved_key == DEFAULT_API_KEY_PLACEHOLDER or not resolved_key.strip():
        logger.warning("=" * 70)
        logger.warning("ATTENTION: No valid Roboflow API Key provided.")
        logger.warning("Pass --api_key <YOUR_KEY> or set the ROBOFLOW_API_KEY environment variable.")
        logger.warning("You can obtain a free API key at: https://app.roboflow.com/")
        logger.warning("=" * 70)

    try:
        from roboflow import Roboflow
    except ImportError:
        logger.error("Roboflow package is not installed. Install via: pip install roboflow")
        sys.exit(1)

    out_folder = Path(output_dir)
    out_folder.mkdir(parents=True, exist_ok=True)

    rf = Roboflow(api_key=resolved_key)

    # Dataset candidate selection
    targets = []
    if workspace and project:
        targets.append((workspace, project, version or 1))
    elif use_fallback:
        targets.append((FALLBACK_DATASET_WORKSPACE, FALLBACK_DATASET_PROJECT, FALLBACK_DATASET_VERSION))
        targets.append((PRIMARY_DATASET_WORKSPACE, PRIMARY_DATASET_PROJECT, PRIMARY_DATASET_VERSION))
    else:
        targets.append((PRIMARY_DATASET_WORKSPACE, PRIMARY_DATASET_PROJECT, PRIMARY_DATASET_VERSION))
        targets.append((FALLBACK_DATASET_WORKSPACE, FALLBACK_DATASET_PROJECT, FALLBACK_DATASET_VERSION))

    dataset_location = None

    for workspace, project_id, version_num in targets:
        logger.info(f"Attempting to download dataset: {workspace}/{project_id} (v{version_num})...")
        try:
            project = rf.workspace(workspace).project(project_id)
            version = project.version(version_num)

            # Download in YOLOv11 (or fallback yolov8 format which is directly compatible with yolo11)
            try:
                dataset = version.download(model_format=model_format, location=str(out_folder))
            except Exception as format_err:
                logger.warning(f"Format '{model_format}' issue ({format_err}), trying 'yolov8' format...")
                dataset = version.download(model_format="yolov8", location=str(out_folder))

            dataset_location = Path(dataset.location)
            logger.info(f"Successfully downloaded dataset to: {dataset_location.resolve()}")
            break
        except Exception as e:
            logger.warning(f"Failed to download from {workspace}/{project_id}: {str(e)}")
            continue

    if not dataset_location:
        raise RuntimeError(
            "Could not download any dataset candidate. Check your Roboflow API key, network connection, or dataset permissions."
        )

    # Verify and summarize data.yaml
    data_yaml_path = dataset_location / "data.yaml"
    if data_yaml_path.exists():
        logger.info(f"Verified data.yaml at: {data_yaml_path.resolve()}")
        try:
            import yaml
            with open(data_yaml_path, "r", encoding="utf-8") as yf:
                cfg = yaml.safe_load(yf)
                nc = cfg.get("nc", "Unknown")
                names = cfg.get("names", [])
                logger.info(f"Dataset Classes ({nc}): {names}")
        except Exception as e:
            logger.debug(f"Could not parse data.yaml for preview: {e}")
    else:
        logger.warning("data.yaml not found directly in dataset root. Check subdirectories.")

    return dataset_location


def parse_args():
    parser = argparse.ArgumentParser(description="Download Scot AI Volleyball Dataset via Roboflow")
    parser.add_argument("--api_key", "--api-key", "-k", type=str, default=None, help="Roboflow API key")
    parser.add_argument("--output_dir", "--output-dir", "-o", type=str, default="./dataset/volleyball_yolov11", help="Target directory")
    parser.add_argument("--format", "-f", type=str, default="yolov11", help="Export format (yolov11 / yolov8)")
    parser.add_argument("--use_fallback", "--use-fallback", action="store_true", help="Directly download lightweight fallback dataset")
    parser.add_argument("--workspace", "-w", type=str, default=None, help="Custom Roboflow workspace slug")
    parser.add_argument("--project", "-p", type=str, default=None, help="Custom Roboflow project slug")
    parser.add_argument("--version", "-v", type=int, default=None, help="Custom dataset version number")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    download_volleyball_dataset(
        api_key=args.api_key,
        output_dir=args.output_dir,
        model_format=args.format,
        use_fallback=args.use_fallback,
        workspace=args.workspace,
        project=args.project,
        version=args.version,
    )

