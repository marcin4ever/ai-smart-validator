def validate_data(records: list) -> list:
    errors = []

    for idx, record in enumerate(records, start=1):
        material = record.get("matnr", "UNKNOWN")
        msg_prefix = f"Record {idx} (Material {material})"

        # Rule 1: Picked quantity must not exceed stock
        pick_qty = record.get("pick_qty", 0)
        stock_qty = record.get("stock_qty", 0)
        if pick_qty > stock_qty:
            errors.append({
                "record": idx,
                "material": material,
                "error": f"{msg_prefix}: Picked quantity ({pick_qty}) exceeds available stock ({stock_qty})."
            })

        # Rule 2: Required fields check (Material, Description)
        if not record.get("matnr") or not record.get("maktx"):
            errors.append({
                "record": idx,
                "material": material,
                "error": f"{msg_prefix}: Missing material number or description."
            })

        # Rule 3: Check if WBS Responsible Name (verna) exists if WBS field is filled
        if record.get("rsnum_ext") and not record.get("verna"):
            errors.append({
                "record": idx,
                "material": material,
                "error": f"{msg_prefix}: WBS responsible name (verna) missing for WBS {record['rsnum_ext']}."
            })

        # Rule 4: Ensure requirement qty is non-negative
        if pick_qty < 0:
            errors.append({
                "record": idx,
                "material": material,
                "error": f"{msg_prefix}: Picked quantity cannot be negative."
            })

    return errors