#!/usr/bin/env python3
"""
YouTube Banner Maker - Parametric Generator Script
CLI and programmatic utility to generate and customize studio-grade YouTube banners.
"""

import argparse
import json
import os
import sys
import xml.etree.ElementTree as ET

TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "templates")

ARCHETYPE_TEMPLATE_MAP = {
    "executive_authority": "01_executive_authority.svg",
    "scale_agency": "02_scale_agency_dtc.svg",
    "creative_director": "03_creative_director_swiss.svg",
    "solo_founder": "04_solo_founder_saas.svg",
    "creator_cutout": "05_creator_portrait_breakout.svg",
    "ecom_growth_lab": "06_ecom_growth_lab.svg",
    "minimalist_editorial": "07_minimalist_editorial_studio.svg",
}

DEFAULT_PARAMS = {
    "TITLE": "CHANNEL NAME",
    "TAGLINE": "CURATED ESSAYS & HIGH-CONVERTING SYSTEMS",
    "PROOF_TEXT": "NEW EPISODES WEEKLY",
    "SCHEDULE_PROOF": "NEW EPISODES EVERY SUNDAY",
    "PILL_1": "GROWTH",
    "PILL_2": "SYSTEMS",
    "PILL_3": "8-FIGURE DTC",
}

def generate_banner(archetype: str, params: dict, output_path: str = None) -> str:
    template_file = ARCHETYPE_TEMPLATE_MAP.get(archetype)
    if not template_file:
        raise ValueError(f"Unknown archetype: {archetype}. Available: {list(ARCHETYPE_TEMPLATE_MAP.keys())}")

    full_template_path = os.path.join(TEMPLATE_DIR, template_file)
    if not os.path.exists(full_template_path):
        raise FileNotFoundError(f"Template not found at: {full_template_path}")

    with open(full_template_path, "r", encoding="utf-8") as f:
        svg_content = f.read()

    import xml.sax.saxutils

    # Merge user params with defaults
    merged_params = {**DEFAULT_PARAMS, **params}

    for key, val in merged_params.items():
        placeholder = f"{{{{{key}}}}}"
        escaped_val = xml.sax.saxutils.escape(str(val))
        svg_content = svg_content.replace(placeholder, escaped_val)

    # Validate XML parsing
    try:
        ET.fromstring(svg_content)
    except ET.ParseError as e:
        raise RuntimeError(f"Generated SVG has XML syntax errors: {e}")

    if output_path:
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(svg_content)
        print(f"✓ Successfully generated banner: {output_path}")

    return svg_content

def main():
    parser = argparse.ArgumentParser(description="Generate customized YouTube channel banners from studio templates.")
    parser.add_argument("--archetype", choices=list(ARCHETYPE_TEMPLATE_MAP.keys()), default="scale_agency", help="Template archetype")
    parser.add_argument("--title", help="Channel / creator headline title")
    parser.add_argument("--tagline", help="Value proposition / subtitle")
    parser.add_argument("--proof", help="Credibility metric or schedule text")
    parser.add_argument("--config", help="Path to JSON config file")
    parser.add_argument("--output", default="banner_output.svg", help="Path for output SVG")

    args = parser.parse_args()

    params = {}
    if args.config:
        with open(args.config, "r", encoding="utf-8") as f:
            params = json.load(f)

    if args.title:
        params["TITLE"] = args.title
    if args.tagline:
        params["TAGLINE"] = args.tagline
    if args.proof:
        params["PROOF_TEXT"] = args.proof
        params["SCHEDULE_PROOF"] = args.proof

    generate_banner(args.archetype, params, args.output)

if __name__ == "__main__":
    main()
