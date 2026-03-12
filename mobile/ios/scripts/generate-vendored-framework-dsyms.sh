#!/bin/sh

set -eu

if [ -z "${DWARF_DSYM_FOLDER_PATH:-}" ] || [ -z "${FRAMEWORKS_FOLDER_PATH:-}" ]; then
  exit 0
fi

FRAMEWORKS_DIR="${TARGET_BUILD_DIR}/${FRAMEWORKS_FOLDER_PATH}"

if [ ! -d "${FRAMEWORKS_DIR}" ]; then
  exit 0
fi

generate_dsym() {
  framework_name="$1"
  binary_name="$2"
  binary_path="${FRAMEWORKS_DIR}/${framework_name}.framework/${binary_name}"
  output_path="${DWARF_DSYM_FOLDER_PATH}/${framework_name}.framework.dSYM"
  log_path="${TARGET_TEMP_DIR}/${framework_name}.framework.dsymutil.log"

  if [ ! -f "${binary_path}" ]; then
    echo "Skipping ${framework_name}.framework dSYM generation; binary not found at ${binary_path}"
    return 0
  fi

  echo "Generating dSYM for ${framework_name}.framework"
  rm -rf "${output_path}"

  if ! xcrun dsymutil "${binary_path}" -o "${output_path}" >"${log_path}" 2>&1; then
    cat "${log_path}" >&2
    exit 1
  fi

  if [ ! -f "${output_path}/Contents/Resources/DWARF/${binary_name}" ]; then
    echo "error: Failed to generate ${framework_name}.framework dSYM" >&2
    exit 1
  fi

  if [ -s "${log_path}" ]; then
    echo "dsymutil emitted warnings for ${framework_name}.framework; generated dSYM anyway."
  fi

  rm -f "${log_path}"
}

generate_dsym "React" "React"
generate_dsym "ReactNativeDependencies" "ReactNativeDependencies"
generate_dsym "hermes" "hermes"
