#[cfg(desktop)]
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[allow(unused_mut)]
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = builder
            .setup(|app| {
                app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;
                app.handle().plugin(tauri_plugin_process::init())?;

                let play_pause_i = MenuItem::with_id(app, "play_pause", "播放 / 暂停", true, None::<&str>)?;
                let prev_i = MenuItem::with_id(app, "prev", "上一曲", true, None::<&str>)?;
                let next_i = MenuItem::with_id(app, "next", "下一曲", true, None::<&str>)?;
                let show_i = MenuItem::with_id(app, "show", "显示主界面", true, None::<&str>)?;
                let quit_i = MenuItem::with_id(app, "quit", "退出应用", true, None::<&str>)?;
                let tray_menu = Menu::with_items(app, &[&play_pause_i, &prev_i, &next_i, &show_i, &quit_i])?;

                if let Some(icon) = app.default_window_icon().cloned() {
                    let _tray = TrayIconBuilder::new()
                        .icon(icon)
                        .menu(&tray_menu)
                        .show_menu_on_left_click(false)
                        .on_tray_icon_event(|tray, event| {
                            if let TrayIconEvent::Click {
                                button: MouseButton::Left,
                                button_state: MouseButtonState::Up,
                                ..
                            } = event
                            {
                                let app = tray.app_handle();
                                if let Some(window) = app.get_webview_window("main") {
                                    let _ = window.unminimize();
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                        })
                        .on_menu_event(|app, event| {
                            use tauri::Emitter;
                            match event.id.as_ref() {
                                "play_pause" => {
                                    let _ = app.emit("tray-action", "toggle_play");
                                }
                                "prev" => {
                                    let _ = app.emit("tray-action", "prev");
                                }
                                "next" => {
                                    let _ = app.emit("tray-action", "next");
                                }
                                "show" => {
                                    if let Some(window) = app.get_webview_window("main") {
                                        let _ = window.unminimize();
                                        let _ = window.show();
                                        let _ = window.set_focus();
                                    }
                                }
                                "quit" => {
                                    app.exit(0);
                                }
                                _ => {}
                            }
                        })
                        .build(app)?;
                }

                Ok(())
            })
            .on_window_event(|window, event| {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    let _ = window.hide();
                    api.prevent_close();
                }
            });
    }

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
