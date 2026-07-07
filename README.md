# AR 眼镜试戴

移动端 AR 虚拟试戴眼镜 H5 应用。

## 功能

- 实时人脸检测 + 3D 眼镜叠加
- 4 种眼镜款式（飞行员/圆框/猫眼/方框）
- 5 种颜色可选
- 拍照保存
- 跟随头部旋转（俯仰/偏航/翻滚）

## 快速启动

```bash
npm install
npm run dev
```

## 手机访问

浏览器要求 HTTPS 才能调用摄像头（localhost 除外）。两种方式：

### 方式一：同局域网 + 自签证书（推荐）

```bash
# 安装 mkcert
brew install mkcert   # macOS
# 或 apt install mkcert  # Linux

# 生成本地证书
mkcert -install
mkcert localhost 192.168.x.x  # 换成你电脑的局域网 IP

# 用生成的证书启动
npx vite --host 0.0.0.0 --https \
  --ssl-cert ./192.168.x.x+1.pem \
  --ssl-key ./192.168.x.x+1-key.pem
```

手机浏览器访问 `https://192.168.x.x:5173`

### 方式二：电脑浏览器直接用

访问 `http://localhost:5173`，电脑摄像头直接可用（localhost 免 HTTPS）。

## 技术栈

- Vite
- Three.js（3D 眼镜渲染）
- MediaPipe Face Mesh（468 个面部关键点）
