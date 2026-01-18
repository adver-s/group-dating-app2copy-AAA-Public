-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cognito_sub" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatar_url" TEXT,
    "bio" TEXT,
    "age" INTEGER,
    "gender" INTEGER NOT NULL DEFAULT 0,
    "cancel_rate" INTEGER NOT NULL DEFAULT 0,
    "last_login" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "teams" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "gender" INTEGER NOT NULL DEFAULT 1,
    "target_gender" INTEGER NOT NULL DEFAULT 1,
    "smoke" INTEGER,
    "alcohol" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "team_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "joined_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_changed_at" DATETIME,
    CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "team_photos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "team_id" INTEGER NOT NULL,
    "photo_url" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "team_photos_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "team_weekdays" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "team_id" INTEGER NOT NULL,
    "weekday" INTEGER NOT NULL,
    "time_slot" INTEGER NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "team_weekdays_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "team_hobbies" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "team_id" INTEGER NOT NULL,
    "hobby_tag" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "team_hobbies_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "team_prefectures" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "team_id" INTEGER NOT NULL,
    "prefecture_code" INTEGER NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "team_prefectures_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "group_matching_flows" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "from_group_id" INTEGER NOT NULL,
    "to_group_id" INTEGER NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "group_matching_flows_from_group_id_fkey" FOREIGN KEY ("from_group_id") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_matching_flows_to_group_id_fkey" FOREIGN KEY ("to_group_id") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_hidden_groups" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "hidden_group_id" INTEGER NOT NULL,
    "status" INTEGER NOT NULL,
    "hidden_start" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hidden_until" DATETIME,
    "reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "user_hidden_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_hidden_groups_hidden_group_id_fkey" FOREIGN KEY ("hidden_group_id") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chat_rooms" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matching_flow_id" INTEGER NOT NULL,
    "last_message_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "chat_rooms_matching_flow_id_fkey" FOREIGN KEY ("matching_flow_id") REFERENCES "group_matching_flows" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_cognito_sub_key" ON "users"("cognito_sub");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_age_idx" ON "users"("age");

-- CreateIndex
CREATE INDEX "users_gender_idx" ON "users"("gender");

-- CreateIndex
CREATE UNIQUE INDEX "teams_uuid_key" ON "teams"("uuid");

-- CreateIndex
CREATE INDEX "teams_name_idx" ON "teams"("name");

-- CreateIndex
CREATE INDEX "teams_gender_idx" ON "teams"("gender");

-- CreateIndex
CREATE INDEX "teams_target_gender_idx" ON "teams"("target_gender");

-- CreateIndex
CREATE INDEX "team_members_team_id_idx" ON "team_members"("team_id");

-- CreateIndex
CREATE INDEX "team_members_user_id_idx" ON "team_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_team_id_user_id_status_key" ON "team_members"("team_id", "user_id", "status");

-- CreateIndex
CREATE INDEX "team_photos_team_id_display_order_idx" ON "team_photos"("team_id", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "team_photos_team_id_display_order_key" ON "team_photos"("team_id", "display_order");

-- CreateIndex
CREATE INDEX "team_weekdays_team_id_idx" ON "team_weekdays"("team_id");

-- CreateIndex
CREATE INDEX "team_weekdays_weekday_time_slot_idx" ON "team_weekdays"("weekday", "time_slot");

-- CreateIndex
CREATE UNIQUE INDEX "team_weekdays_team_id_weekday_time_slot_key" ON "team_weekdays"("team_id", "weekday", "time_slot");

-- CreateIndex
CREATE INDEX "team_hobbies_team_id_idx" ON "team_hobbies"("team_id");

-- CreateIndex
CREATE INDEX "team_hobbies_hobby_tag_idx" ON "team_hobbies"("hobby_tag");

-- CreateIndex
CREATE UNIQUE INDEX "team_hobbies_team_id_hobby_tag_key" ON "team_hobbies"("team_id", "hobby_tag");

-- CreateIndex
CREATE INDEX "team_prefectures_team_id_idx" ON "team_prefectures"("team_id");

-- CreateIndex
CREATE INDEX "team_prefectures_prefecture_code_idx" ON "team_prefectures"("prefecture_code");

-- CreateIndex
CREATE UNIQUE INDEX "team_prefectures_team_id_prefecture_code_key" ON "team_prefectures"("team_id", "prefecture_code");

-- CreateIndex
CREATE UNIQUE INDEX "group_matching_flows_uuid_key" ON "group_matching_flows"("uuid");

-- CreateIndex
CREATE INDEX "group_matching_flows_from_group_id_idx" ON "group_matching_flows"("from_group_id");

-- CreateIndex
CREATE INDEX "group_matching_flows_to_group_id_idx" ON "group_matching_flows"("to_group_id");

-- CreateIndex
CREATE INDEX "group_matching_flows_status_idx" ON "group_matching_flows"("status");

-- CreateIndex
CREATE UNIQUE INDEX "group_matching_flows_from_group_id_to_group_id_key" ON "group_matching_flows"("from_group_id", "to_group_id");

-- CreateIndex
CREATE INDEX "user_hidden_groups_user_id_idx" ON "user_hidden_groups"("user_id");

-- CreateIndex
CREATE INDEX "user_hidden_groups_hidden_group_id_idx" ON "user_hidden_groups"("hidden_group_id");

-- CreateIndex
CREATE INDEX "user_hidden_groups_status_idx" ON "user_hidden_groups"("status");

-- CreateIndex
CREATE UNIQUE INDEX "user_hidden_groups_user_id_hidden_group_id_status_key" ON "user_hidden_groups"("user_id", "hidden_group_id", "status");

-- CreateIndex
CREATE INDEX "chat_rooms_matching_flow_id_idx" ON "chat_rooms"("matching_flow_id");

-- CreateIndex
CREATE INDEX "chat_rooms_last_message_at_idx" ON "chat_rooms"("last_message_at");
