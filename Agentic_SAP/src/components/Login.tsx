import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { mockUsers } from "../data/mockData";
import { User, Brain, Star, ChevronRight } from "lucide-react";

const Login: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      login(selectedUser);
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-primary-600 p-3 rounded-full">
              <Star className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            SAPhire
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            From onboarding to leadership, with AI brilliance
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Select Demo User
            </h3>

            {mockUsers.map((user) => (
              <label
                key={user.id}
                className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  selectedUser === user.id
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
              >
                <input
                  type="radio"
                  name="user"
                  value={user.id}
                  checked={selectedUser === user.id}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center flex-1">
                  <div
                    className={`p-2 rounded-full mr-3 ${
                      selectedUser === user.id
                        ? "bg-primary-500"
                        : "bg-gray-400"
                    }`}
                  >
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user.role}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={`h-4 w-4 transition-colors ${
                    selectedUser === user.id
                      ? "text-primary-500"
                      : "text-gray-400"
                  }`}
                />
              </label>
            ))}

            <button
              type="submit"
              disabled={!selectedUser}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                selectedUser
                  ? "bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Enter Platform
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Demo platform - Select any user to explore features</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
