# 🎬 Cinema Backend - Microservices Architecture

Hệ thống backend cho ứng dụng đặt vé xem phim được xây dựng theo kiến trúc microservices với Node.js + TypeScript.

## 🏗️ Kiến trúc hệ thống

```
cinemas-backend/
├── api-gateway/                    # API Gateway - Port 3000
│   ├── src/
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
│
├── services/
│   ├── auth-service/              # Auth Service - Port 3001
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── repositories/
│   │   │   ├── models/
│   │   │   ├── middlewares/
│   │   │   ├── routes/
│   │   │   └── server.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── catalog-service/           # Catalog Service - Port 3002
│       ├── src/
│       │   ├── config/
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── repositories/
│       │   ├── models/
│       │   ├── middlewares/
│       │   ├── routes/
│       │   └── server.ts
│       ├── package.json
│       └── tsconfig.json
│
├── docker-compose.yml
└── README.md
```

## 🚀 Services

### 🌐 API Gateway (Port 3000)
- **Mục đích**: Điểm vào duy nhất cho tất cả API requests
- **Chức năng**: 
  - Route requests đến services tương ứng
  - Load balancing
  - Rate limiting
  - Logging tập trung

### 🔐 Auth Service (Port 3001)
- **Mục đích**: Quản lý xác thực và phân quyền
- **Endpoints**:
  - `POST /register` - Đăng ký người dùng
  - `POST /login` - Đăng nhập
  - `POST /refresh` - Làm mới token
  - `POST /logout` - Đăng xuất

### 🎬 Catalog Service (Port 3002)
- **Mục đích**: Quản lý phim, rạp, suất chiếu
- **Endpoints**:
  - `GET /movies` - Danh sách phim
  - `GET /movies/:id` - Chi tiết phim
  - `GET /cinemas` - Danh sách rạp
  - `GET /showtimes` - Suất chiếu

## 🛠️ Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: MongoDB
- **Cache**: Redis
- **Gateway**: Express + http-proxy-middleware
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston, Morgan

## 📦 Cài đặt và chạy

### 1. Clone repository
```bash
git clone <repo-url>
cd cinemas-backend
```

### 2. Cài đặt dependencies cho từng service

#### API Gateway
```bash
cd api-gateway
npm install
```

#### Auth Service
```bash
cd services/auth-service
npm install
```

#### Catalog Service
```bash
cd services/catalog-service
npm install
```

### 3. Cấu hình Environment Variables

Copy file `.env.example` thành `.env` cho từng service và cập nhật các giá trị:

```bash
# API Gateway
cp api-gateway/.env.example api-gateway/.env

# Auth Service
cp services/auth-service/.env.example services/auth-service/.env

# Catalog Service
cp services/catalog-service/.env.example services/catalog-service/.env
```

### 4. Chạy với Docker Compose (Recommended)

```bash
# Chạy tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 5. Chạy từng service riêng biệt (Development)

**Terminal 1 - Auth Service:**
```bash
cd services/auth-service
npm run dev
```

**Terminal 2 - Catalog Service:**
```bash
cd services/catalog-service
npm run dev
```

**Terminal 3 - API Gateway:**
```bash
cd api-gateway
npm run dev
```

## 🔗 API Endpoints

### Qua API Gateway (Port 3000)

#### Auth Endpoints
- `POST /api/auth/register` → Auth Service
- `POST /api/auth/login` → Auth Service
- `POST /api/auth/refresh` → Auth Service
- `POST /api/auth/logout` → Auth Service

#### Catalog Endpoints
- `GET /api/catalog/movies` → Catalog Service
- `GET /api/catalog/movies/:id` → Catalog Service
- `GET /api/catalog/cinemas` → Catalog Service
- `GET /api/catalog/showtimes` → Catalog Service

#### Health Checks
- `GET /health` - API Gateway health
- `GET /api/auth/health` - Auth Service health
- `GET /api/catalog/health` - Catalog Service health

## 🐳 Docker

### Build images
```bash
# Build tất cả
docker-compose build

# Build từng service
docker-compose build auth-service
docker-compose build catalog-service
docker-compose build api-gateway
```

### Quản lý containers
```bash
# Xem status
docker-compose ps

# Restart service
docker-compose restart auth-service

# Xem logs của service cụ thể
docker-compose logs -f auth-service
```

## 🔧 Development

### Scripts có sẵn cho mỗi service:
```bash
npm run dev        # Chạy development server
npm run build      # Build TypeScript
npm run start      # Chạy production server
npm run lint       # Check code quality
npm run lint:fix   # Fix lint issues
npm run format     # Format code với Prettier
```

### Database
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

### Testing APIs
```bash
# Gateway info
curl http://localhost:3000

# Auth service (qua gateway)
curl http://localhost:3000/api/auth/

# Catalog service (qua gateway)
curl http://localhost:3000/api/catalog/

# Direct access to services
curl http://localhost:3001  # Auth service
curl http://localhost:3002  # Catalog service
```

## 🚀 Production Deployment

1. **Environment Variables**: Cập nhật production values
2. **Database**: Setup MongoDB cluster
3. **Reverse Proxy**: Nginx/Traefik trước API Gateway
4. **Monitoring**: Add monitoring tools (Prometheus, Grafana)
5. **Logging**: Centralized logging (ELK stack)

## 📝 TODO

- [ ] Implement authentication logic
- [ ] Add database models and repositories
- [ ] Implement movie catalog features
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Add CI/CD pipeline
- [ ] Add monitoring and alerting
- [ ] Add API documentation (Swagger)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License.