"""
Stream Control for Icecast / Liquidsoap (Phase 3)

Allows the main radio to send commands to the Liquidsoap instance
controlling the broadcast stream (voiceovers, metadata, etc.).
"""
import socket
import os
from typing import Optional

from config import LIQUIDSOAP_TELNET_HOST, LIQUIDSOAP_TELNET_PORT


def send_liquidsoap_command(command: str) -> Optional[str]:
    """
    Send a raw command to Liquidsoap's telnet server.
    Returns the response or None on failure.
    """
    try:
        with socket.create_connection((LIQUIDSOAP_TELNET_HOST, LIQUIDSOAP_TELNET_PORT), timeout=3) as sock:
            sock.sendall((command + "\n").encode())
            # Read response (Liquidsoap ends responses with a blank line or END)
            response = b""
            while True:
                chunk = sock.recv(1024)
                if not chunk:
                    break
                response += chunk
                if b"\n\n" in response or b"END" in response:
                    break
            return response.decode(errors="ignore").strip()
    except Exception as e:
        print(f"[stream] Failed to talk to Liquidsoap: {e}")
        return None


def insert_voiceover(wav_path: str, announce_text: str) -> bool:
    """
    Tell Liquidsoap to play a voiceover file immediately.
    The Liquidsoap script must have registered the 'voiceover' command.
    """
    # Escape the path and text for telnet
    safe_path = wav_path.replace('"', '\\"')
    safe_text = announce_text.replace('"', '\\"')
    cmd = f'voiceover "{safe_path}" "{safe_text}"'
    result = send_liquidsoap_command(cmd)
    print(f"[stream] Voiceover command sent. Response: {result}")
    return result is not None and "OK" in (result or "")


def update_now_playing(title: str, artist: str = "") -> bool:
    """
    Push better metadata to the Icecast stream.
    """
    full_title = f"{artist} - {title}" if artist else title
    cmd = f'metadata.set title="{full_title}"'
    result = send_liquidsoap_command(cmd)
    return result is not None