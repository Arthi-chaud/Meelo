{
  pkgs ? import <nixpkgs> { },
}:
pkgs.mkShell {
  packages = with pkgs; [
    yaml-language-server

    nixfmt
    xmlformat

    docker
    docker-compose
    docker-buildx
    docker-language-server
  ];

}
