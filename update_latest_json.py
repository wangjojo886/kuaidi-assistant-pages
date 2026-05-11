#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

TZ_SHANGHAI = timezone(timedelta(hours=8))


def normalize_packages(raw_packages):
    result = []
    if not isinstance(raw_packages, list):
        return result

    for item in raw_packages:
        if not isinstance(item, dict):
            continue
        tracking_numbers = item.get("trackingNumbers")
        if not isinstance(tracking_numbers, list):
            tracking_numbers = item.get("tracking_numbers", [])
        if not isinstance(tracking_numbers, list):
            tracking_numbers = []

        numbers = [str(x).strip() for x in tracking_numbers if str(x).strip()]
        if not numbers:
            continue

        result.append(
            {
                "trackingNumbers": numbers,
                "date": str(item.get("date", "")).strip(),
                "location": str(item.get("location", "")).strip(),
                "createdAt": str(item.get("createdAt", item.get("created_at", ""))).strip(),
                "order": int(item.get("order", item.get("order_num", 0)) or 0),
            }
        )
    return result


def main():
    parser = argparse.ArgumentParser(
        description="把后台导出的 JSON 转成 Cloudflare Pages 用的 latest.json"
    )
    parser.add_argument(
        "--input",
        required=True,
        help="后台导出的 JSON 文件路径（系统设置 -> 导出数据）",
    )
    parser.add_argument(
        "--output",
        default=str(Path(__file__).with_name("latest.json")),
        help="输出 latest.json 路径（默认当前目录 latest.json）",
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    raw = json.loads(input_path.read_text(encoding="utf-8"))
    packages = normalize_packages(raw.get("packages", []))
    export_time = str(raw.get("exportTime", "")).strip()

    payload = {
        "latestUpdatedAt": datetime.now(TZ_SHANGHAI).isoformat(),
        "exportTime": export_time,
        "packages": packages,
    }
    output_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"已生成: {output_path}，共 {len(packages)} 条")


if __name__ == "__main__":
    main()
