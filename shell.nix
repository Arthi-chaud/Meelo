{
  pkgs ? import <nixpkgs> { },
}:
pkgs.mkShell {
  inputsFrom = [
    (import ./server/shell.nix { inherit pkgs; })
    (import ./matcher/shell.nix { inherit pkgs; })
    (import ./scanner/shell.nix { inherit pkgs; })
  ];

  packages = [
    pkgs.yaml-language-server
  ];

}
