#!/usr/bin/env python3
"""Run a remote bash script on the Vibe VPS without nested-heredoc issues."""
import os
import sys
import pathlib
import paramiko

def main():
    if len(sys.argv) < 2:
        print("Usage: remote-run.py <local-script.sh>", file=sys.stderr)
        sys.exit(1)
    script_path = pathlib.Path(sys.argv[1])
    script = script_path.read_text(encoding="utf-8")
    host = "87.232.72.14"
    user = "root"
    password = os.environ.get("DEPLOY_PASS")
    if not password:
        print("DEPLOY_PASS required", file=sys.stderr)
        sys.exit(2)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    key_path = pathlib.Path.home() / ".ssh" / "id_ed25519_vibe"
    connected = False
    if key_path.exists():
        try:
            pkey = paramiko.Ed25519Key.from_private_key_file(str(key_path))
            client.connect(
                host,
                username=user,
                pkey=pkey,
                timeout=30,
                look_for_keys=False,
                allow_agent=False,
            )
            connected = True
        except Exception:
            pass
    if not connected:
        if not password:
            print("DEPLOY_PASS required (or working SSH key)", file=sys.stderr)
            sys.exit(2)
        client.connect(
            host,
            username=user,
            password=password,
            timeout=30,
            look_for_keys=False,
            allow_agent=False,
        )
    sftp = client.open_sftp()
    remote = "/tmp/vibe-remote-run.sh"
    with sftp.file(remote, "w") as f:
        f.write(script)
    sftp.chmod(remote, 0o700)
    sftp.close()

    stdin, stdout, stderr = client.exec_command(f"bash {remote}; rm -f {remote}", get_pty=True)
    while True:
        line = stdout.readline()
        if not line:
            break
        sys.stdout.buffer.write(line.encode("utf-8", errors="replace"))
        sys.stdout.buffer.flush()
    err = stderr.read().decode("utf-8", errors="replace")
    if err:
        sys.stderr.write(err)
    sys.exit(stdout.channel.recv_exit_status())

if __name__ == "__main__":
    main()
