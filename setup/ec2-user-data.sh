#!/bin/bash
# Paste this whole file into "Advanced details -> User data" when launching each EC2 server.
# It installs Docker automatically on first boot. Nothing to type in a terminal.
curl -fsSL https://get.docker.com | sh
usermod -aG docker ubuntu
systemctl enable --now docker
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
echo "DOCKER READY" > /home/ubuntu/READY.txt
