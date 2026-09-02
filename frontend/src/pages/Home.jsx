import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories } from "../api/client.js";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="home">
      <h1 className="page-title">카테고리를 선택하세요</h1>
      <p className="page-subtitle">내 옷장에 등록된 옷을 카테고리별로 확인하고 관리할 수 있어요.</p>

      {loading && <p className="state-text">불러오는 중...</p>}
      {error && <p className="state-text state-error">{error}</p>}

      <div className="category-grid">
        <Link to="/outfits" className="category-card">
          <span className="category-card-name">코디</span>
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/category/${category.id}`}
            className="category-card"
          >
            <span className="category-card-name">{category.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
