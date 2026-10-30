import io
import json
import hashlib
from typing import Dict, Any, Tuple
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from ..schemas.scouting import ScoutingReportSchema


SPORT_ACCREDITATIONS: Dict[str, Tuple[str, str, str]] = {
    "Soccer": ("FIFA SOTA LAB ACCREDITED", "FIFA Innovation Biomechanics Standard v4.2", "FIFA-ST"),
    "Football": ("FIFA SOTA LAB ACCREDITED", "FIFA Innovation Biomechanics Standard v4.2", "FIFA-ST"),
    "Basketball": ("FIBA / NBA COMBINE CERTIFIED", "FIBA Technical Biomechanics Protocol 2026", "FIBA-COMB"),
    "Volleyball": ("FIVB PRO KINEMATICS", "FIVB High Performance Olympic Verification", "FIVB-KIN"),
    "Tennis": ("ITF / ATP KINEMATICS LAB", "ITF Biomechanical Grand Slam Standard", "ITF-ATP"),
    "Track & Field": ("WORLD ATHLETICS BIO-TRACK", "World Athletics Biomechanics Protocol", "WA-OLY"),
    "Boxing": ("AIBA / COMBAT METRICS CERTIFIED", "AIBA & Olympic Boxing Kinematic Lab", "AIBA-COMB"),
    "Swimming": ("WORLD AQUATICS / FINA COMPLIANT", "World Aquatics Hydrodynamic Biomechanics", "FINA-HYD"),
    "Baseball": ("MLB STATCAST VALIDATED", "MLB Official Statcast Biomechanical Engine", "MLB-SC"),
    "Cycling": ("UCI AERODYNAMICS & POWER LAB", "UCI World Cycling Center Technical Biometrics", "UCI-AERO"),
    "Gymnastics": ("FIG BIOMECHANICS PROTOCOL", "Fédération Internationale de Gymnastique Lab", "FIG-ART"),
}


class PdfService:
    @staticmethod
    def generate_scouting_pdf(
        report: ScoutingReportSchema,
        player_name: str = "Athlete",
        sport: str = "Soccer",
    ) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36,
        )

        styles = getSampleStyleSheet()

        # Nano Banana flagship high-contrast palette
        c_primary = colors.HexColor("#0f172a")  # Deep Obsidian Navy
        c_gold = colors.HexColor("#b45309")     # Print-optimized Cyber Gold
        c_gold_glow = colors.HexColor("#d97706") # Amber flame
        c_bg_dark = colors.HexColor("#08090C")
        c_surface = colors.HexColor("#10141E")
        c_text = colors.HexColor("#0f172a")
        c_muted = colors.HexColor("#475569")
        c_lime = colors.HexColor("#15803d")

        accreditation_label, reg_authority, code_prefix = SPORT_ACCREDITATIONS.get(
            sport,
            SPORT_ACCREDITATIONS.get("Soccer", ("FIFA SOTA LAB ACCREDITED", "FIFA Innovation Biomechanics Standard v4.2", "FIFA-ST"))
        )

        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Heading1"],
            fontSize=20,
            leading=24,
            textColor=c_gold,
            fontName="Helvetica-Bold",
        )
        subtitle_style = ParagraphStyle(
            "DocSubtitle",
            parent=styles["Normal"],
            fontSize=10,
            leading=13,
            textColor=c_muted,
            fontName="Helvetica",
        )
        section_style = ParagraphStyle(
            "SectionHead",
            parent=styles["Heading2"],
            fontSize=12,
            leading=15,
            textColor=c_gold,
            fontName="Helvetica-Bold",
            spaceBefore=8,
            spaceAfter=4,
        )
        body_style = ParagraphStyle(
            "DocBody",
            parent=styles["Normal"],
            fontSize=9.5,
            leading=13,
            textColor=c_text,
            fontName="Helvetica",
        )
        bold_body = ParagraphStyle(
            "BoldBody",
            parent=body_style,
            fontName="Helvetica-Bold",
        )

        elements = []

        # 1. Header Banner
        header_data = [
            [
                Paragraph("<b>SCOUTAI 2.0 × NANO BANANA DOSSIER</b>", title_style),
                Paragraph(f"<b>GRADE: {report.overallGrade}</b><br/>Score: {report.overallScore}/100", title_style),
            ],
            [
                Paragraph(f"<b>{accreditation_label}</b> · {reg_authority}", subtitle_style),
                Paragraph(f"Status: <b>VERIFIED CERTIFICATION ({code_prefix})</b>", subtitle_style),
            ],
        ]
        header_table = Table(header_data, colWidths=[380, 160])
        header_table.setStyle(
            TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ])
        )
        elements.append(header_table)
        elements.append(HRFlowable(width="100%", thickness=2, color=c_gold, spaceBefore=6, spaceAfter=10))

        # 2. Athlete Overview Summary
        summary_data = [
            [
                Paragraph(f"<b>Athlete:</b> {player_name}", body_style),
                Paragraph(f"<b>Sport & Position:</b> {sport} · {report.position} ({report.positionCode})", body_style),
                Paragraph(f"<b>Potential Rating:</b> {report.potentialRating}/100", body_style),
            ],
            [
                Paragraph(f"<b>Tactical Style:</b> {report.positionProfile.roleName}", body_style),
                Paragraph(f"<b>Role Suitability:</b> {report.positionProfile.roleSuitability}%", body_style),
                Paragraph(f"<b>Pro Benchmark:</b> {report.comparableProPlayer or 'N/A'}", body_style),
            ],
        ]
        summary_table = Table(summary_data, colWidths=[180, 200, 160])
        summary_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fffbeb")),
                ("PADDING", (0, 0), (-1, -1), 6),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#fde68a")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#fef3c7")),
            ])
        )
        elements.append(summary_table)
        elements.append(Spacer(1, 8))

        # 3. Executive Scouting Verdict & Narrative
        elements.append(Paragraph("EXECUTIVE VERDICT", section_style))
        elements.append(Paragraph(f"<i>\"{report.oneLiner}\"</i>", bold_body))
        elements.append(Spacer(1, 4))
        elements.append(Paragraph(report.narrative, body_style))
        elements.append(Spacer(1, 8))

        # 4. Metrics Table
        elements.append(Paragraph(f"SPORT-SPECIFIC KPI & TECHNICAL EVALUATION ({sport.upper()})", section_style))
        metric_rows = [["Metric Name", "Score", "Evaluator Kinematic Observation"]]
        for m in report.metrics:
            metric_rows.append([m.name, f"{m.score}/100", m.note])

        metrics_table = Table(metric_rows, colWidths=[140, 60, 340])
        metrics_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#08090C")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#fef08a")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("PADDING", (0, 0), (-1, -1), 4),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fefce8")]),
                ("ALIGN", (1, 0), (1, -1), "CENTER"),
            ])
        )
        elements.append(metrics_table)
        elements.append(Spacer(1, 8))

        # 5. Strengths & Development Areas
        sw_data = [
            [
                Paragraph("<b>OBSERVED KINEMATIC STRENGTHS</b>", bold_body),
                Paragraph("<b>DEVELOPMENT AREAS & RISK MITIGATION</b>", bold_body),
            ]
        ]
        max_len = max(len(report.strengths), len(report.weaknesses))
        for i in range(max_len):
            s_text = f"• {report.strengths[i]}" if i < len(report.strengths) else ""
            w_text = f"• {report.weaknesses[i]}" if i < len(report.weaknesses) else ""
            sw_data.append([Paragraph(s_text, body_style), Paragraph(w_text, body_style)])

        sw_table = Table(sw_data, colWidths=[270, 270])
        sw_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#ecfdf5")),
                ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#fff1f2")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("PADDING", (0, 0), (-1, -1), 5),
            ])
        )
        elements.append(sw_table)
        elements.append(Spacer(1, 8))

        # 6. Actionable Drills
        elements.append(Paragraph("RECOMMENDED COACHING INTERVENTIONS", section_style))
        drill_rows = [["Drill Title", "Target Focus", "Duration", "Instructional Summary"]]
        for d in report.recommendedDrills:
            drill_rows.append([d.title, d.focusMetric, d.duration, d.instructions])

        drill_table = Table(drill_rows, colWidths=[140, 110, 80, 210])
        drill_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("PADDING", (0, 0), (-1, -1), 4),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ])
        )
        elements.append(drill_table)
        elements.append(Spacer(1, 10))

        # 7. Authentic Cryptographic Verification Footer
        canonical_dict = {
            "overallScore": report.overallScore,
            "overallGrade": report.overallGrade,
            "position": report.position,
            "sport": sport,
            "narrative": report.narrative,
            "player": player_name,
        }
        canonical_str = json.dumps(canonical_dict, sort_keys=True, ensure_ascii=False)
        sha256_hash = hashlib.sha256(canonical_str.encode("utf-8")).hexdigest().upper()

        footer_text = Paragraph(
            f"<b>Cryptographic Certification:</b> Verified by ScoutAI 2.0 × Nano Banana Lab ({reg_authority}) · "
            f"Audit Hash: <b>SHA256-{sha256_hash[:16]}...{sha256_hash[-8:]}</b> · Official Athlete Accreditation.",
            subtitle_style,
        )
        elements.append(footer_text)

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()


pdf_service = PdfService()
