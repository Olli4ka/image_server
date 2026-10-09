import logging
import subprocess
from datetime import datetime
from pathlib import Path

BACKUP_DIR = Path(__file__).resolve().parent

DB_CONTAINER = "images-db"
DB_NAME = "image_server"
DB_USER = "postgres"

BACKUP_DIR.mkdir(exist_ok=True)

logging.basicConfig(
    filename=BACKUP_DIR / "backup.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)


def log_to_app(message):
    try:
        subprocess.run(
            [
                "docker", "exec", "images-server",
                "python", "-c",
                (
                    "import logging; "
                    "logging.basicConfig("
                    "filename='/app/logs/app.log', "
                    "level=logging.INFO, "
                    "format='[%(asctime)s] %(levelname)s: %(message)s', "
                    "datefmt='%Y-%m-%d %H:%M:%S'); "
                    f"logging.info({message!r})"
                ),
            ],
            check=True,
            capture_output=True,
            text=True,
        )
    except (subprocess.CalledProcessError, OSError) as error:
        logging.error("Could not write to application log: %s", error)



def create_backup():
    timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    backup_path = BACKUP_DIR / f"backup_{timestamp}.sql"

    try:
        result = subprocess.run(
            [
                "docker",
                "exec",
                DB_CONTAINER,
                "pg_dump",
                "-U",
                DB_USER,
                DB_NAME,
            ],
            capture_output=True,
            check=True,
        )

        backup_path.write_bytes(result.stdout)

        logging.info(
            "Database backup created successfully: %s",
            backup_path.name,
        )

        print(f"Backup created: {backup_path}")
        log_to_app(f"Database backup created successfully: {backup_path.name}")

    except (subprocess.CalledProcessError, OSError) as error:
        logging.error("Database backup failed: %s", error)

        if isinstance(error, subprocess.CalledProcessError):
            logging.error(
                "pg_dump error: %s",
                error.stderr.decode("utf-8", errors="replace"),
            )

        backup_path.unlink(missing_ok=True)
        log_to_app(f"Database backup failed: {error}")
        print(f"Backup failed: {error}")
        raise


if __name__ == "__main__":
    create_backup()
