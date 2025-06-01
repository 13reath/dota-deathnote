import React, { useState, useEffect } from "react";

// Константы
const DEFAULT_AVATAR =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5X6ogzfr0FUFNPMew2RYWgOSjtWs55DyAaw&s";
const DOTABUFF_BASE_URL = "https://www.dotabuff.com/players/";
const STORAGE_KEYS = {
  PLAYERS: "dota_players_data",
  USERNAME: "dota_username",
};

const PLAYERS_JSON_URL = process.env.PUBLIC_URL + "/players.json";
const GITHUB_API_URL = `https://api.github.com/repos/13reath/dota-deathnote/contents/public/players.json`;

const initialPlayers = [
  {
    id: "899041750",
    nickname: "Andryha24)",
    avatar:
      "https://avatars.cloudflare.steamstatic.com/978f0f4f5e6d962b0c0fa7eca06a490d99a20a59_full.jpg",
    comments: [{ id: 1, text: "bot)", author: "13reath", hidden: false }],
  },
];

// Утилиты для работы с данными
const DataUtils = {
  getPlayers: async () => {
    try {
      // Для разработки - используем локальный файл
      if (process.env.NODE_ENV === "development") {
        const response = await fetch(PLAYERS_JSON_URL);
        return await response.json();
      }

      // Для продакшена - используем GitHub API
      const response = await fetch(
        `${PLAYERS_JSON_URL}?t=${Date.now()}` // Добавляем timestamp для избежания кеширования
      );
      return await response.json();
    } catch (error) {
      console.error("Ошибка при загрузке данных:", error);
      return initialPlayers;
    }
  },

  savePlayers: async (players, commitMessage = "Update players list") => {
    // В режиме разработки сохраняем в localStorage
    if (process.env.NODE_ENV === "development") {
      localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
      return;
    }

    try {
      // Получаем текущий SHA файла
      const fileInfo = await fetch(GITHUB_API_URL);
      const fileData = await fileInfo.json();
      const sha = fileData.sha;

      // Обновляем файл через GitHub API
      const response = await fetch(GITHUB_API_URL, {
        method: "PUT",
        headers: {
          Authorization: `token ${process.env.REACT_APP_GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: commitMessage,
          content: btoa(JSON.stringify(players, null, 2)),
          sha: sha,
        }),
      });

      if (!response.ok) {
        throw new Error("Ошибка при сохранении данных");
      }
    } catch (error) {
      console.error("Ошибка при сохранении данных:", error);
      throw error;
    }
  },

  getUsername: () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.USERNAME) || "Анонимный";
    } catch (error) {
      console.error("Ошибка при загрузке имени пользователя:", error);
      return "Анонимный";
    }
  },

  saveUsername: (username) => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERNAME, username);
    } catch (error) {
      console.error("Ошибка при сохранении имени пользователя:", error);
    }
  },
};

const FileUtils = {
  convertToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  },
};

const useKeyPress = (key, callback) => {
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === key) callback();
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [key, callback]);
};

const usePlayers = () => {
  const [players, setPlayers] = useState(initialPlayers);
  const [username, setUsername] = useState(() => DataUtils.getUsername());
  const [isLoading, setIsLoading] = useState(true);

  // Загружаем игроков при монтировании
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const loadedPlayers = await DataUtils.getPlayers();
        setPlayers(loadedPlayers);
      } catch (error) {
        console.error("Failed to load players:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlayers();
  }, []);

  const savePlayers = async (updatedPlayers) => {
    try {
      await DataUtils.savePlayers(updatedPlayers);
    } catch (error) {
      console.error("Failed to save players:", error);
    }
  };

  const addPlayer = async (playerData) => {
    const newPlayer = {
      id: playerData.id,
      nickname: playerData.nickname,
      avatar: playerData.avatar || DEFAULT_AVATAR,
      comments: playerData.comment
        ? [
            {
              id: Date.now(),
              text: playerData.comment,
              author: username,
              hidden: false,
            },
          ]
        : [],
    };

    const updatedPlayers = [...players, newPlayer];
    setPlayers(updatedPlayers);
    await savePlayers(updatedPlayers);
  };

  const addComment = async (playerId, commentText, author) => {
    const updatedPlayers = players.map((player) =>
      player.id === playerId
        ? {
            ...player,
            comments: [
              ...player.comments,
              {
                id: Date.now() + Math.random(),
                text: commentText,
                author,
                hidden: false,
              },
            ],
          }
        : player
    );

    setPlayers(updatedPlayers);
    await savePlayers(updatedPlayers);
  };

  const deleteComment = async (playerId, commentId) => {
    const updatedPlayers = players.map((player) =>
      player.id === playerId
        ? {
            ...player,
            comments: player.comments.filter((c) => c.id !== commentId),
          }
        : player
    );

    setPlayers(updatedPlayers);
    await savePlayers(updatedPlayers);
  };

  const updateUsername = (newUsername) => {
    setUsername(newUsername);
    DataUtils.saveUsername(newUsername);
  };

  return {
    players,
    isLoading,
    addPlayer,
    addComment,
    deleteComment,
    username,
    updateUsername,
  };
};

// Компонент лоадера (остается без изменений)
function DotaLoader() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-red-900 via-red-800 to-black flex items-center justify-center z-50">
      <div className="text-center">
        <div className="relative">
          <div className="w-24 h-24 mx-auto mb-4 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-black rounded-full flex items-center justify-center">
              <span className="text-red-500 text-2xl font-bold">D2</span>
            </div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Dota Bots Tracker
        </h2>
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
      </div>
    </div>
  );
}

// Основной компонент (остается без изменений, только замените StorageUtils на DataUtils)
export default function App() {
  const {
    players,
    isLoading,
    addPlayer,
    addComment,
    deleteComment,
    username,
    updateUsername,
  } = usePlayers();
  const [searchType, setSearchType] = useState("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortType, setSortType] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  useKeyPress("Escape", () => {
    setShowAddModal(false);
    setShowCommentModal(false);
  });

  const filteredAndSortedPlayers = React.useMemo(() => {
    let filtered = players.filter((player) => {
      if (!searchQuery) return true;

      if (searchType === "1") {
        return player.id.toLowerCase().includes(searchQuery.toLowerCase());
      } else {
        return player.nickname
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      }
    });

    return filtered.sort((a, b) => {
      switch (sortType) {
        case "archived":
          return b.comments.length - a.comments.length;
        default:
          return 0;
      }
    });
  }, [players, searchQuery, searchType, sortType]);

  const handleAddPlayer = () => setShowAddModal(true);

  const handleAddComment = (playerId) => {
    setSelectedPlayerId(playerId);
    setShowCommentModal(true);
  };

  const handleCloseModals = () => {
    setShowAddModal(false);
    setShowCommentModal(false);
    setSelectedPlayerId(null);
  };

  if (isLoading) {
    return <DotaLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        searchType={searchType}
        setSearchType={setSearchType}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortType={sortType}
        setSortType={setSortType}
        onAddPlayer={handleAddPlayer}
      />

      <PlayersList
        players={filteredAndSortedPlayers}
        onAddComment={handleAddComment}
        onDeleteComment={deleteComment}
      />

      {showAddModal && (
        <AddPlayerModal
          onClose={handleCloseModals}
          onAddPlayer={addPlayer}
          username={username}
        />
      )}

      {showCommentModal && selectedPlayerId && (
        <AddCommentModal
          onClose={handleCloseModals}
          onAddComment={(comment, author) =>
            addComment(selectedPlayerId, comment, author)
          }
          playerNickname={
            players.find((p) => p.id === selectedPlayerId)?.nickname
          }
          username={username}
          updateUsername={updateUsername}
        />
      )}
    </div>
  );
}

// Остальные компоненты (Navbar, PlayersList, PlayerCard, CommentsSection, AddPlayerModal, AddCommentModal)
// остаются без изменений, как в вашем исходном коде

// Компонент навигации с кнопкой очистки данных
function Navbar({
  searchType,
  setSearchType,
  searchQuery,
  setSearchQuery,
  sortType,
  setSortType,
  onAddPlayer,
}) {
  return (
    <nav className="flex justify-center gap-4 border-b-2 bg-white p-4 shadow-sm flex-wrap">
      <select
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={searchType}
        onChange={(e) => setSearchType(e.target.value)}
      >
        <option value="1">Поиск Игрока по ID</option>
        <option value="2">Поиск Игрока по NICKNAME</option>
      </select>

      <input
        type="text"
        placeholder={
          searchType === "1" ? "Введите ID игрока" : "Введите никнейм игрока"
        }
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <select
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={sortType}
        onChange={(e) => setSortType(e.target.value)}
      >
        <option value="all">По Новизне</option>
        <option value="archived">По Количеству Комментариев</option>
      </select>

      <button
        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
        onClick={onAddPlayer}
      >
        Добавить Игрока
      </button>
    </nav>
  );
}

// Компонент списка игроков
function PlayersList({ players, onAddComment, onDeleteComment }) {
  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Список игроков ({players.length})
      </h2>

      {players.length === 0 ? (
        <div className="text-center text-gray-500 py-8">Игроки не найдены</div>
      ) : (
        <div className="space-y-4">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onAddComment={() => onAddComment(player.id)}
              onDeleteComment={onDeleteComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Компонент карточки игрока
function PlayerCard({ player, onAddComment, onDeleteComment }) {
  const [showComments, setShowComments] = useState(false);
  const visibleComments = player.comments.filter((comment) => !comment.hidden);

  const handleViewProfile = () => {
    window.open(`${DOTABUFF_BASE_URL}${player.id}`, "_blank");
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img
            src={player.avatar}
            alt={`${player.nickname} avatar`}
            className="w-16 h-16 rounded-full object-cover"
            onError={(e) => {
              e.target.src = DEFAULT_AVATAR;
            }}
          />
          <div>
            <h3 className="text-xl font-semibold text-gray-800">
              {player.nickname}
            </h3>
            <p className="text-sm text-gray-500">ID: {player.id}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleViewProfile}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
          >
            Просмотр
          </button>
          <button
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
            onClick={onAddComment}
          >
            Добавить комментарий
          </button>
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
            onClick={() => setShowComments(!showComments)}
          >
            Комментарии ({visibleComments.length})
          </button>
        </div>
      </div>

      {showComments && (
        <CommentsSection
          comments={visibleComments}
          playerId={player.id}
          onDeleteComment={onDeleteComment}
        />
      )}
    </div>
  );
}

// Компонент секции комментариев
function CommentsSection({ comments, playerId, onDeleteComment }) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      {comments.length > 0 ? (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">Комментарии:</h4>
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-gray-50 p-3 rounded-md flex justify-between items-start"
            >
              <p className="text-gray-700">
                {comment.text}{" "}
                <span className="text-sm text-gray-500">
                  (c) {comment.author}
                </span>
              </p>
              <button
                onClick={() => onDeleteComment(playerId, comment.id)}
                className="text-red-500 hover:text-red-700 text-sm ml-2 px-2 py-1 hover:bg-red-50 rounded"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 italic">Нет комментариев</p>
      )}
    </div>
  );
}

// Модальное окно добавления игрока
function AddPlayerModal({ onClose, onAddPlayer, username }) {
  const [formData, setFormData] = useState({
    id: "",
    nickname: "",
    avatar: "",
    comment: "",
  });

  const handleSubmit = () => {
    if (!formData.id || !formData.nickname) {
      alert("ID и никнейм обязательны для заполнения");
      return;
    }
    onAddPlayer(formData);
    onClose();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const base64 = await FileUtils.convertToBase64(file);
        setFormData({ ...formData, avatar: base64 });
      } catch (error) {
        alert("Ошибка при загрузке файла");
      }
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">Добавить игрока</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ID игрока *
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Никнейм *
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.nickname}
            onChange={(e) =>
              setFormData({ ...formData, nickname: e.target.value })
            }
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Аватар
          </label>
          <div className="space-y-2">
            <input
              type="url"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.avatar}
              onChange={(e) =>
                setFormData({ ...formData, avatar: e.target.value })
              }
              placeholder="https://example.com/avatar.jpg"
            />
            <div className="text-center text-gray-500">или</div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Начальный комментарий
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            value={formData.comment}
            onChange={(e) =>
              setFormData({ ...formData, comment: e.target.value })
            }
            placeholder="Опциональный комментарий о игроке"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Добавить
          </button>
        </div>
      </div>
    </div>
  );
}

// Модальное окно добавления комментария
function AddCommentModal({
  onClose,
  onAddComment,
  playerNickname,
  username,
  updateUsername,
}) {
  const [comment, setComment] = useState("");
  const [author, setAuthor] = useState(username);

  const handleSubmit = () => {
    if (!comment.trim() || !author.trim()) {
      alert("Комментарий и имя автора не могут быть пустыми");
      return;
    }
    updateUsername(author.trim());
    onAddComment(comment.trim(), author.trim());
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">
          Добавить комментарий для {playerNickname}
        </h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ваш никнейм
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Введите ваш никнейм"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Комментарий
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Напишите ваш комментарий о игроке..."
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            Добавить
          </button>
        </div>
      </div>
    </div>
  );
}
