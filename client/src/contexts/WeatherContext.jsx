import React, { createContext, useContext, useState, useEffect } from "react";

const WeatherContext = createContext();

export const useWeather = () => useContext(WeatherContext);

// 날씨와 시간대별 추천 장르/분위기 매핑
const RECOMMENDATION_MAP = {
  // 날씨: [맑음, 흐림, 비, 눈]
  weather: {
    Clear: { emoji: "☀️", label: "맑음", genres: ["자기계발", "경제 / 경영", "여행"], vibes: "상쾌하고 활기찬" },
    Clouds: { emoji: "☁️", label: "흐림", genres: ["인문학", "역사", "에세이"], vibes: "차분하고 깊이 있는" },
    Rain: { emoji: "🌧️", label: "비", genres: ["소설", "에세이", "인문학"], vibes: "감성적이고 몽환적인" },
    Snow: { emoji: "❄️", label: "눈", genres: ["소설", "어린이", "예술 / 대중문화"], vibes: "포근하고 따뜻한" },
    Drizzle: { emoji: "🌦️", label: "이슬비", genres: ["에세이", "소설"], vibes: "잔잔한" },
    Thunderstorm: { emoji: "⛈️", label: "천둥번개", genres: ["소설", "인문학"], vibes: "긴장감 넘치는" },
  },
  // 시간대: [새벽, 아침, 오후, 저녁, 밤]
  time: {
    dawn: { label: "새벽", genres: ["에세이", "인문학", "소설"], vibes: "고요한" },
    morning: { label: "아침", genres: ["경제 / 경영", "자기계발", "과학"], vibes: "희망찬" },
    afternoon: { label: "오후", genres: ["소설", "여행", "만화"], vibes: "여유로운" },
    evening: { label: "저녁", genres: ["인문학", "역사", "에세이"], vibes: "사색적인" },
    night: { label: "밤", genres: ["소설", "인문학", "예술 / 대중문화"], vibes: "신비로운" },
  }
};

const CITY_NAME_MAP = {
  Seoul: "서울",
  Incheon: "인천",
  Busan: "부산",
  Daegu: "대구",
  Daejeon: "대전",
  Gwangju: "광주",
  Ulsan: "울산",
  Suwon: "수원",
  Seongnam: "성남",
  Goyang: "고양",
  Yongin: "용인",
  Bucheon: "부천",
  Ansan: "안산",
  Cheongju: "청주",
  Jeonju: "전주",
  Cheonan: "천안",
  Changwon: "창원",
  Pohang: "포항",
  Jeju: "제주",
  Sejong: "세종",
  Gimhae: "김해",
  Anyang: "안양",
  Pyeongtaek: "평택",
  Siheung: "시흥",
  Uijeongbu: "의정부",
  Gumi: "구미",
  Hanam: "하남",
  Wonju: "원주",
};

export const WeatherProvider = ({ children }) => {
  const [weather, setWeather] = useState(null);
  const [timeState, setTimeState] = useState("afternoon");
  const [loading, setLoading] = useState(true);

  const updateTimeState = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) setTimeState("morning");
    else if (hour >= 11 && hour < 17) setTimeState("afternoon");
    else if (hour >= 17 && hour < 21) setTimeState("evening");
    else if (hour >= 21 || hour < 2) setTimeState("night");
    else setTimeState("dawn");
  };

  const fetchWeather = async (lat, lon) => {
    try {
      const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
      
      if (!API_KEY) {
        const weathers = ["Clear", "Clouds", "Rain", "Snow"];
        const randomWeather = weathers[Math.floor(Math.random() * weathers.length)];
        setWeather({ main: randomWeather, description: "맑음 (데모)", city: "서울" });
        return;
      }

      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=kr`
      );
      const data = await res.json();
      console.log("Weather API Response Data:", data);

      // 도시 이름 한글화 (매핑 테이블 사용 및 기본값 처리)
      const rawCityName = data.name;
      const localizedCityName = CITY_NAME_MAP[rawCityName] || rawCityName;

      setWeather({
        main: data.weather[0].main,
        temp: Math.round(data.main.temp),
        city: localizedCityName,
        description: data.weather[0].description,
        icon: data.weather[0].icon
      });
    } catch (error) {
      console.error("Failed to fetch weather:", error);
      setWeather({ main: "Clear", temp: 20, city: "서울" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    updateTimeState();
    const timer = setInterval(updateTimeState, 60000);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => {
          setWeather({ main: "Clear", temp: 20 });
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setWeather({ main: "Clear", temp: 20 });
      setLoading(false);
    }

    return () => clearInterval(timer);
  }, []);

  const getRecommendedGenres = () => {
    const weatherGenres = (RECOMMENDATION_MAP.weather[weather?.main] || RECOMMENDATION_MAP.weather.Clear).genres;
    const timeGenres = RECOMMENDATION_MAP.time[timeState].genres;
    
    // 두 리스트를 합치고 중복 제거
    return [...new Set([...weatherGenres, ...timeGenres])];
  };

  const getVibe = () => {
    const weatherVibe = (RECOMMENDATION_MAP.weather[weather?.main] || RECOMMENDATION_MAP.weather.Clear).vibes;
    const timeVibe = RECOMMENDATION_MAP.time[timeState].vibes;
    return `${weatherVibe} ${timeVibe} 분위기`;
  };

  const value = {
    weather,
    timeState,
    loading,
    recommendation: {
      genres: getRecommendedGenres(),
      vibe: getVibe(),
      weatherLabel: (RECOMMENDATION_MAP.weather[weather?.main] || RECOMMENDATION_MAP.weather.Clear).label,
      timeLabel: RECOMMENDATION_MAP.time[timeState].label,
      emoji: (RECOMMENDATION_MAP.weather[weather?.main] || RECOMMENDATION_MAP.weather.Clear).emoji
    }
  };

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
};
