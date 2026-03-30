generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Organization {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  plan      Plan     @default(FREE)
  apiKey    String   @unique @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  users     User[]
  stations  Station[]
  alerts    Alert[]
  reports   Report[]
  anomalies Anomaly[]
  @@map("organizations")
}

enum Plan { FREE SCIENTIST ENTERPRISE }

model User {
  id            String       @id @default(cuid())
  email         String       @unique
  passwordHash  String
  name          String
  role          Role         @default(VIEWER)
  avatarUrl     String?
  orgId         String
  org           Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  refreshTokens RefreshToken[]
  alertPrefs    AlertPreference[]
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  lastLoginAt   DateTime?
  @@map("users")
}

enum Role { ADMIN SCIENTIST ANALYST VIEWER }

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
  @@map("refresh_tokens")
}

model Station {
  id        String      @id @default(cuid())
  name      String
  code      String      @unique
  type      StationType
  lat       Float
  lng       Float
  elevation Float?
  isActive  Boolean     @default(true)
  orgId     String
  org       Organization @relation(fields: [orgId], references: [id])
  readings  Reading[]
  anomalies Anomaly[]
  createdAt DateTime    @default(now())
  @@index([orgId])
  @@index([lat, lng])
  @@map("stations")
}

enum StationType { AIR WATER MULTI SOIL IMAGERY }

model Feed {
  id           String    @id @default(cuid())
  code         String    @unique
  name         String
  category     FeedCat
  endpoint     String
  pollInterval Int       @default(3600)
  isActive     Boolean   @default(true)
  lastPolledAt DateTime?
  lastStatus   Int?
  latencyMs    Int?
  readings     Reading[]
  createdAt    DateTime  @default(now())
  @@map("feeds")
}

enum FeedCat { AIR WATER WEATHER IMAGERY SOIL BIO }

model Reading {
  id         BigInt   @id @default(autoincrement())
  stationId  String?
  station    Station? @relation(fields: [stationId], references: [id])
  feedId     String
  feed       Feed     @relation(fields: [feedId], references: [id])
  parameter  String
  value      Float
  unit       String
  quality    Int      @default(1)
  recordedAt DateTime
  insertedAt DateTime @default(now())
  @@index([stationId, parameter, recordedAt])
  @@index([feedId, recordedAt])
  @@index([recordedAt])
  @@map("readings")
}

model Anomaly {
  id                String    @id @default(cuid())
  stationId         String?
  station           Station?  @relation(fields: [stationId], references: [id])
  orgId             String
  org               Organization @relation(fields: [orgId], references: [id])
  type              AnomalyType
  parameter         String
  score             Float
  severity          Severity
  model             String
  value             Float
  baseline          Float
  deltaFromBaseline Float
  message           String
  details           Json?
  resolvedAt        DateTime?
  falsePositive     Boolean   @default(false)
  alerts            Alert[]
  occurredAt        DateTime
  createdAt         DateTime  @default(now())
  @@index([orgId, severity, occurredAt])
  @@index([occurredAt])
  @@map("anomalies")
}

enum AnomalyType { HAB_RISK HYPOXIA CROSS_MEDIA BIODIVERSITY CUSTOM }
enum Severity    { CRITICAL HIGH MODERATE LOW INFO }

model Alert {
  id        String      @id @default(cuid())
  orgId     String
  org       Organization @relation(fields: [orgId], references: [id])
  anomalyId String?
  anomaly   Anomaly?    @relation(fields: [anomalyId], references: [id])
  channel   AlertChannel
  recipient String
  status    AlertStatus @default(PENDING)
  sentAt    DateTime?
  error     String?
  createdAt DateTime    @default(now())
  @@map("alerts")
}

enum AlertChannel { EMAIL SMS SLACK WEBHOOK }
enum AlertStatus  { PENDING SENT FAILED }

model AlertPreference {
  id          String      @id @default(cuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  channel     AlertChannel
  destination String
  minSeverity Severity    @default(HIGH)
  isActive    Boolean     @default(true)
  @@map("alert_preferences")
}

model Report {
  id         String       @id @default(cuid())
  orgId      String
  org        Organization @relation(fields: [orgId], references: [id])
  title      String
  type       ReportType
  parameters Json
  fileUrl    String?
  status     ReportStatus @default(PENDING)
  createdAt  DateTime     @default(now())
  @@map("reports")
}

enum ReportType   { MONTHLY_SUMMARY ANOMALY_LOG COMPLIANCE CUSTOM }
enum ReportStatus { PENDING GENERATING READY FAILED }
