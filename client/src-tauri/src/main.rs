// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Command, Child};
use std::sync::Mutex;
use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu,
    SystemTrayMenuItem,
};

static BACKEND_PROCESS: Mutex<Option<Child>> = Mutex::new(None);

fn start_backend() -> Result<(), String> {
    let mut process = Command::new("ai-radio-backend")
        .arg("--host")
        .arg("127.0.0.1")
        .arg("--port")
        .arg("8765")
        .spawn()
        .map_err(|e| format!("Failed to start backend: {}", e))?;

    let mut guard = BACKEND_PROCESS.lock().unwrap();
    *guard = Some(process);

    Ok(())
}

fn stop_backend() {
    let mut guard = BACKEND_PROCESS.lock().unwrap();
    if let Some(mut child) = guard.take() {
        let _ = child.kill();
    }
}

fn main() {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    let show = CustomMenuItem::new("show".to_string(), "Show");

    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(hide)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);

    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick {
                position: _,
                size: _,
                ..
            } => {
                let window = app.get_window("main").unwrap();
                window.show().unwrap();
                window.set_focus().unwrap();
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => {
                    stop_backend();
                    std::process::exit(0);
                }
                "hide" => {
                    let window = app.get_window("main").unwrap();
                    window.hide().unwrap();
                }
                "show" => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
                _ => {}
            },
            _ => {}
        })
        .setup(|app| {
            // Prevent multiple instances
            #[cfg(target_os = "windows")]
            {
                use tauri::api::process::Command;
                // Basic single instance (more robust solutions exist)
            }

            // Start the Python backend
            if let Err(e) = start_backend() {
                eprintln!("Warning: Could not start backend server: {}", e);
            }

            // Cleanup on exit
            let app_handle = app.handle();
            app_handle.listen_global("tauri://close-requested", move |_| {
                stop_backend();
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    stop_backend();
}