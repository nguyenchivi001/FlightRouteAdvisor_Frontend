# Flight Route Advisor - Frontend

Ứng dụng web frontend cho hệ thống tư vấn tuyến đường bay sử dụng Vue 3, Vite, và Vuetify.

## Thành viên nhóm:
- Nguyễn Chí Vĩ - 22521656  
- Võ Đức Vĩnh - 22521684  
- Dương Văn Súa - 22521267  

---

## Yêu cầu hệ thống

- **Node.js**: >= 18.0.0 (khuyến nghị >= 20.x)
- **npm**: >= 9.0.0 hoặc **yarn** >= 1.22.0
- **Backend API**: Backend server phải chạy tại `http://localhost:8000` (hoặc cấu hình trong file `.env`)

---

## Hướng dẫn cài đặt

### 1. Clone repository và cài đặt dependencies

```bash
# Cài đặt các package cần thiết
npm install
```

hoặc nếu sử dụng yarn:

```bash
yarn install
```

### 2. Cấu hình môi trường (Tùy chọn)

Tạo file `.env` trong thư mục gốc để cấu hình URL backend API (nếu khác mặc định):

```env
VITE_API_URL=http://localhost:8000
```

Nếu không có file `.env`, ứng dụng sẽ sử dụng cấu hình mặc định: `http://localhost:8000`

---

## Hướng dẫn chạy dự án

### Chạy development server

```bash
npm run dev
```

hoặc

```bash
yarn dev
```

Ứng dụng sẽ chạy tại: **http://localhost:3000**

Frontend sẽ tự động reload khi có thay đổi trong mã nguồn (Hot Module Replacement).

### Kiểm tra backend API

Trước khi chạy frontend, đảm bảo backend API đã được khởi động tại `http://localhost:8000`. Frontend sử dụng proxy để gọi API thông qua endpoint `/api/*` (được cấu hình trong `vite.config.mjs`).

---

## Build cho production

### Tạo build production

```bash
npm run build
```

hoặc

```bash
yarn build
```

Build output sẽ được tạo trong thư mục `dist/`.

### Preview build production

Để xem trước build production:

```bash
npm run preview
```

hoặc

```bash
yarn preview
```

---

## Các lệnh khác

### Lint code

```bash
npm run lint
```

Lệnh này sẽ tự động sửa các lỗi linting nếu có thể.

---

## Cấu trúc dự án

```
FlightRouteAdvisor_Frontend/
├── src/
│   ├── components/          # Các component Vue
│   │   ├── RouteMap.vue
│   │   ├── RouteResults.vue
│   │   ├── RouteSearchForm.vue
│   │   ├── RouteSummaryCards.vue
│   │   ├── RouteTimeline.vue
│   │   └── WhatIfAnalysis.vue
│   ├── layouts/             # Layout templates
│   │   └── default.vue
│   ├── plugins/             # Plugin configurations
│   │   ├── index.js
│   │   └── vuetify.js
│   ├── router/              # Vue Router configuration
│   │   └── index.js
│   ├── services/            # API services
│   │   └── api.js
│   ├── stores/              # Pinia stores (state management)
│   │   ├── app.js
│   │   └── index.js
│   ├── styles/              # Global styles
│   │   └── settings.scss
│   ├── views/               # Page views
│   │   └── Home.vue
│   ├── App.vue              # Root component
│   └── main.js              # Entry point
├── index.html
├── package.json
├── vite.config.mjs          # Vite configuration
└── README.md
```

---

## Công nghệ sử dụng

- **Vue 3**: Framework JavaScript reactive
- **Vite**: Build tool và development server
- **Vuetify 3**: Material Design component framework
- **Vue Router**: Routing cho SPA
- **Pinia**: State management
- **Axios**: HTTP client cho API calls
- **Vue Leaflet**: Integration với Leaflet maps
- **Leaflet**: Interactive maps library

---

## Output Log / Experiment Diary

### Ngày bắt đầu phát triển
- **Ngày**: [Cập nhật ngày]
- **Ghi chú**: Khởi tạo dự án frontend với Vue 3 + Vite

### Các tính năng đã hoàn thành

#### 1. Tìm kiếm sân bay và tuyến đường
- Component `RouteSearchForm`: Form tìm kiếm với autocomplete sân bay
- Component `RouteResults`: Hiển thị kết quả các tuyến đường thay thế
- Integration với API `/routes/alternatives`

#### 2. Hiển thị bản đồ
- Component `RouteMap`: Bản đồ tương tác hiển thị tuyến đường
- Sử dụng Vue Leaflet để render route paths
- Marker cho các sân bay

#### 3. Tóm tắt và timeline
- Component `RouteSummaryCards`: Hiển thị thông tin tổng quan (thời gian, chi phí, số chặng)
- Component `RouteTimeline`: Timeline trực quan của hành trình

#### 4. Phân tích What-If
- Component `WhatIfAnalysis`: Phân tích tác động khi loại bỏ hub
- Integration với API `/hubs/removal-analysis` và `/hubs/alternatives`

### Các vấn đề đã gặp và cách giải quyết

#### Vấn đề CORS khi gọi API
- **Mô tả**: Lỗi CORS khi frontend gọi trực tiếp đến backend API
- **Giải pháp**: Sử dụng Vite proxy trong `vite.config.mjs` để redirect `/api/*` đến backend server
- **Cấu hình**:
  ```javascript
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  }
  ```

#### Leaflet CSS không load
- **Mô tả**: Bản đồ Leaflet không hiển thị đúng style
- **Giải pháp**: Import CSS của Leaflet trong `index.html`:
  ```html
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  ```

#### Timeout khi gọi API với dữ liệu lớn
- **Mô tả**: Request bị timeout khi tính toán các tuyến đường phức tạp
- **Giải pháp**: Tăng timeout trong axios config lên 120000ms (2 phút)
- **Vị trí**: `src/services/api.js`

### Log khi chạy development server

```bash
$ npm run dev

  VITE v7.1.5  ready in 500 ms

  Local:   http://localhost:3000/
  Network: use --host to expose
  press h + enter to show help
```

### Log khi build production

```bash
$ npm run build

  vite v7.1.5 building for production...
  transforming...
  45 modules transformed.
  rendering chunks...
  45 modules transformed.
  computing gated chunks...
  building...
  dist/index.html                   0.50 kB
  dist/assets/index-[hash].js       245.78 kB
  dist/assets/index-[hash].css      45.23 kB
  built in 2.5s
```

### Các endpoint API được sử dụng

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/health` | GET | Health check |
| `/airports/search` | GET | Tìm kiếm sân bay |
| `/airports/{iata}` | GET | Thông tin chi tiết sân bay |
| `/routes/alternatives` | POST | Tìm các tuyến đường thay thế |
| `/routes/compare-algorithms` | POST | So sánh các thuật toán tìm đường |
| `/hubs/top` | GET | Lấy danh sách top hubs |
| `/hubs/removal-analysis` | POST | Phân tích tác động khi loại bỏ hub |
| `/hubs/alternatives` | POST | Tìm hub thay thế |
| `/graph/stats` | GET | Thống kê đồ thị |

---

## Lưu ý

1. **Backend API**: Đảm bảo backend server đang chạy trước khi khởi động frontend
2. **CORS**: Nếu chạy frontend và backend trên các domain/port khác, cần cấu hình CORS ở backend
3. **Port**: Mặc định frontend chạy trên port 3000. Nếu port đã được sử dụng, Vite sẽ tự động đề xuất port khác
4. **Browser Support**: Ứng dụng hỗ trợ các browser hiện đại (Chrome, Firefox, Edge, Safari)

---

## Liên hệ

Nếu có vấn đề hoặc câu hỏi, vui lòng liên hệ các thành viên nhóm hoặc tạo issue trên repository.
