{
  pkgs ? import <nixpkgs> { },
}:
pkgs.mkShell rec {
  venvDir = "./.venv";
  buildInputs = with pkgs; [
    python314
    python314Packages.venvShellHook
    ruff
    pyright
  ];
  # SRC: https://nixos.org/manual/nixpkgs/stable/#python
  shellHook = ''
    SOURCE_DATE_EPOCH=$(date +%s)

    if [ ! -d "${venvDir}" ]; then
      echo "Creating new venv environment in path: '${venvDir}'"
      ${pkgs.python3Packages.python.interpreter} -m venv "${venvDir}"
    fi

    PYTHONPATH=$PWD/${venvDir}/${pkgs.python3Packages.python.sitePackages}/:$PYTHONPATH
    source "${venvDir}/bin/activate"
    pip install -r requirements.txt -qqq # Hiding verbose logs
  '';
  postShellHook = ''
    unset SOURCE_DATE_EPOCH
  '';
}
