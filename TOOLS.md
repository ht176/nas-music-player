# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

## SSH Hosts

- **NAS (XiaoYunJia)** → 192.168.1.8:8022, user: hetong
  - 密钥认证：`~/.ssh/id_rsa` (RSA 3072)
  - 群晖 DSM，SSH 配置已修改 `/etc.defaults/ssh/sshd_config`
  - 公钥已添加到 `~/.ssh/authorized_keys`

- **OpenWrt Router** → 192.168.1.1, user: root
  - 密钥认证：`~/.ssh/openwrt_key2` (ED25519)
  - OpenWrt 24.10.2, OpenSSH 9.9.2
  - 运行时间：158 天

## 网络架构

### 拓扑结构
```
外网
  ↓
光猫 (192.168.1.2) ← 主网关，负责端口转发
  ↓
  ├─→ 群晖 NAS (192.168.1.8)
  ├─→ OpenWrt (192.168.1.1) ← 代理网关，运行 OpenClash
  ├─→ 路由器 R600V2 (192.168.1.3) ← 网关指向 192.168.1.1，提供 Wi-Fi
  └─→ 台式机 (192.168.1.35)
```

### 设备列表
| 设备 | IP 地址 | 角色 |
|------|---------|------|
| 光猫 | 192.168.1.2 | 主网关，端口转发 |
| OpenWrt (R600V2 刷机) | 192.168.1.1 | 代理网关 (OpenClash) |
| 中兴路由器 | 192.168.1.3 | Wi-Fi 接入点，网关指向 192.168.1.1 |
| 群晖 NAS | 192.168.1.8 | 存储服务 |
| 台式机 | 192.168.1.35 | 有线设备 |

### 光猫端口转发
| 外网端口 | 内网目标 | 内网端口 | 用途 |
|---------|---------|---------|------|
| 8 | NAS (192.168.1.8) | 8001 | HTTP 服务 |
| 6 | NAS (192.168.1.8) | 8443 | HTTPS (Nginx) |

### 科学上网原理
1. **OpenWrt (192.168.1.1)** 运行 OpenClash 透明代理
2. **路由器 R600V2 (192.168.1.3)** 网关设置为 192.168.1.1
3. 所有连接 R600V2 Wi-Fi 的设备 → 流量经过 R600V2 → OpenWrt → 外网
4. 实现 Wi-Fi 设备自动科学上网，无需手动配置

### NAS 服务
- **端口 8001**: HTTP 服务
- **端口 8443**: Nginx HTTPS 反向代理

### 注意事项
- 家庭宽带 80/443 端口被运营商封锁
- 使用非常规端口 (8/6) 进行转发
- 通过 OpenClash 实现透明代理
