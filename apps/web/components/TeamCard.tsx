import React from 'react';
import { getTeamGenderDisplay, getTargetGenderDisplay, getSmokeDisplay, getAlcoholDisplay, getHobbyDisplay, getPrefectureDisplay, getWeekdayDisplay, getTimeSlotDisplay } from '../utils/displayUtils';

interface Team {
  id: string;
  name: string;
  description: string;
  gender: number;
  target_gender: number;
  smoke: number;
  alcohol: number;
  max_members: number;
  member_count: number;
  photos: string[];
  weekdays: Array<{ weekday: number; timeSlot: number }>;
  hobbies: string[];
  prefectures: number[];
  members: Array<{
    id: string;
    username: string;
    avatar_url?: string;
    age: number;
    gender: number;
    role: string;
  }>;
  created_at: string;
}

interface TeamCardProps {
  team: Team;
  onClick?: () => void;
}

const TeamCard: React.FC<TeamCardProps> = ({ team, onClick }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      {/* チーム写真 */}
      <div className="relative mb-4">
        {team.photos && team.photos.length > 0 ? (
          <img 
            src={team.photos[0]} 
            alt={team.name}
            className="w-full h-48 object-cover rounded-lg"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-gray-500">写真なし</span>
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          {team.member_count}/{team.max_members}
        </div>
      </div>

      {/* チーム名 */}
      <h3 className="text-lg font-bold mb-2">{team.name}</h3>

      {/* 説明 */}
      {team.description && (
        <p className="text-gray-600 text-sm mb-3">{team.description}</p>
      )}

      {/* 基本情報 */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div>
          <span className="text-gray-500">性別:</span>
          <span className="ml-1">{getTeamGenderDisplay(team.gender)}</span>
        </div>
        <div>
          <span className="text-gray-500">表示対象:</span>
          <span className="ml-1">{getTargetGenderDisplay(team.target_gender)}</span>
        </div>
        <div>
          <span className="text-gray-500">喫煙:</span>
          <span className="ml-1">{getSmokeDisplay(team.smoke)}</span>
        </div>
        <div>
          <span className="text-gray-500">お酒:</span>
          <span className="ml-1">{getAlcoholDisplay(team.alcohol)}</span>
        </div>
      </div>

      {/* 曜日・時間帯 */}
      {team.weekdays && team.weekdays.length > 0 && (
        <div className="mb-3">
          <span className="text-gray-500 text-sm">希望時間:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {team.weekdays.map((weekday, index) => (
              <span 
                key={index}
                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
              >
                {getWeekdayDisplay(weekday.weekday)} {getTimeSlotDisplay(weekday.timeSlot)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ノリタグ */}
      {team.hobbies && team.hobbies.length > 0 && (
        <div className="mb-3">
          <span className="text-gray-500 text-sm">ノリタグ:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {team.hobbies.map((hobby, index) => (
              <span 
                key={index}
                className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
              >
                {getHobbyDisplay(hobby)}
                </span>
            ))}
          </div>
              </div>
            )}

      {/* 都道府県 */}
      {team.prefectures && team.prefectures.length > 0 && (
        <div className="mb-3">
          <span className="text-gray-500 text-sm">希望地域:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {team.prefectures.map((prefecture, index) => (
              <span 
                key={index}
                className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded"
              >
                {getPrefectureDisplay(prefecture)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* メンバー */}
      {team.members && team.members.length > 0 && (
        <div className="mb-3">
          <span className="text-gray-500 text-sm">メンバー:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {team.members.map((member, index) => (
              <span 
                key={index}
                className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
              >
                {member.username} ({member.age}歳)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 作成日 */}
      <div className="text-xs text-gray-400 mt-2">
        作成日: {new Date(team.created_at).toLocaleDateString('ja-JP')}
      </div>
    </div>
  );
};

export default TeamCard; 