import React, { createContext, useContext, useState, useEffect, useRef } from "react";

const WeatherContext = createContext();

export const useWeather = () => useContext(WeatherContext);

// 날씨와 시간대별 추천 장르/분위기 매핑
const RECOMMENDATION_MAP = {
  // 날씨: [맑음, 흐림, 비, 눈]
  weather: {
    Clear: { emoji: "☀️", label: "맑음", genres: ["자기계발", "경제 / 경영", "여행"], vibes: "상쾌하고 활기찬" },
    Clouds: { emoji: "☁️", label: "흐림", genres: ["인문학", "역사", "에세이"], vibes: "차분하고 깊이 있는" },
    Rain: { emoji: "🌧️", label: "비", genres: ["소설", "에세이", "인문학"], vibes: "감성적이고 몽환적인" },
    Snow: { emoji: "❄️", label: "눈", genres: ["소설", "에세이", "역사"], vibes: "포근하고 따뜻한" },
    Drizzle: { emoji: "🌦️", label: "이슬비", genres: ["에세이", "소설", "인문학"], vibes: "잔잔한" },
    Thunderstorm: { emoji: "⛈️", label: "천둥번개", genres: ["소설", "인문학", "역사"], vibes: "긴장감 넘치는" },
  },
  // 시간대: [새벽, 아침, 오후, 저녁, 밤]
  time: {
    dawn: { label: "새벽", genres: ["에세이", "인문학", "소설"], vibes: "고요한" },
    morning: { label: "오전", genres: ["경제 / 경영", "자기계발", "과학"], vibes: "희망찬" },
    afternoon: { label: "오후", genres: ["소설", "여행", "에세이"], vibes: "여유로운" },
    evening: { label: "저녁", genres: ["인문학", "역사", "에세이"], vibes: "사색적인" },
    night: { label: "밤", genres: ["소설", "인문학", "에세이"], vibes: "신비로운" },
  }
};

const CITY_NAME_MAP = {
  // 광역시/특별시
  Seoul: "서울",
  Incheon: "인천",
  Busan: "부산",
  Daegu: "대구",
  Daejeon: "대전",
  Gwangju: "광주",
  Ulsan: "울산",
  Sejong: "세종",
  // 서울 구
  "Gangnam-gu": "강남구",
  "Gangdong-gu": "강동구",
  "Gangbuk-gu": "강북구",
  "Gangseo-gu": "강서구",
  "Gwanak-gu": "관악구",
  "Gwangjin-gu": "광진구",
  "Guro-gu": "구로구",
  "Geumcheon-gu": "금천구",
  "Nowon-gu": "노원구",
  "Dobong-gu": "도봉구",
  "Dongdaemun-gu": "동대문구",
  "Dongjak-gu": "동작구",
  "Mapo-gu": "마포구",
  "Seodaemun-gu": "서대문구",
  "Seocho-gu": "서초구",
  "Seongdong-gu": "성동구",
  "Seongbuk-gu": "성북구",
  "Songpa-gu": "송파구",
  "Yangcheon-gu": "양천구",
  "Yeongdeungpo-gu": "영등포구",
  "Yongsan-gu": "용산구",
  "Eunpyeong-gu": "은평구",
  "Jongno-gu": "종로구",
  "Jung-gu": "중구",
  "Jungnang-gu": "중랑구",
  // 경기도 시
  Suwon: "수원",
  "Suwon-si": "수원",
  Seongnam: "성남",
  "Seongnam-si": "성남",
  Goyang: "고양",
  "Goyang-si": "고양",
  Yongin: "용인",
  "Yongin-si": "용인",
  Bucheon: "부천",
  "Bucheon-si": "부천",
  Ansan: "안산",
  "Ansan-si": "안산",
  Anyang: "안양",
  "Anyang-si": "안양",
  Pyeongtaek: "평택",
  "Pyeongtaek-si": "평택",
  Siheung: "시흥",
  "Siheung-si": "시흥",
  Uijeongbu: "의정부",
  "Uijeongbu-si": "의정부",
  Hanam: "하남",
  "Hanam-si": "하남",
  Gimpo: "김포",
  "Gimpo-si": "김포",
  Namyangju: "남양주",
  "Namyangju-si": "남양주",
  Hwaseong: "화성",
  "Hwaseong-si": "화성",
  Paju: "파주",
  "Paju-si": "파주",
  Icheon: "이천",
  "Icheon-si": "이천",
  Gapyeong: "가평",
  Gwangmyeong: "광명",
  "Gwangmyeong-si": "광명",
  Gunpo: "군포",
  "Gunpo-si": "군포",
  Uiwang: "의왕",
  "Uiwang-si": "의왕",
  Osan: "오산",
  "Osan-si": "오산",
  Gongju: "공주",
  Yangju: "양주",
  "Yangju-si": "양주",
  Yangpyeong: "양평",
  Yeoncheon: "연천",
  Pocheon: "포천",
  "Pocheon-si": "포천",
  // 인천 구
  "Namdong-gu": "남동구",
  "Bupyeong-gu": "부평구",
  "Gyeyang-gu": "계양구",
  "Seo-gu": "서구",
  "Dong-gu": "동구",
  "Nam-gu": "남구",
  // 지방 시
  Cheongju: "청주",
  "Cheongju-si": "청주",
  Jeonju: "전주",
  "Jeonju-si": "전주",
  Cheonan: "천안",
  "Cheonan-si": "천안",
  Changwon: "창원",
  "Changwon-si": "창원",
  Pohang: "포항",
  "Pohang-si": "포항",
  Jeju: "제주",
  "Jeju-si": "제주",
  Gimhae: "김해",
  "Gimhae-si": "김해",
  Gumi: "구미",
  "Gumi-si": "구미",
  Wonju: "원주",
  "Wonju-si": "원주",
  Chuncheon: "춘천",
  "Chuncheon-si": "춘천",
  Gangneung: "강릉",
  "Gangneung-si": "강릉",
  Sokcho: "속초",
  "Sokcho-si": "속초",
  Yeosu: "여수",
  "Yeosu-si": "여수",
  Suncheon: "순천",
  "Suncheon-si": "순천",
  Mokpo: "목포",
  "Mokpo-si": "목포",
  Iksan: "익산",
  "Iksan-si": "익산",
  Gunsan: "군산",
  "Gunsan-si": "군산",
  Andong: "안동",
  "Andong-si": "안동",
  Gyeongju: "경주",
  "Gyeongju-si": "경주",
  Tongyeong: "통영",
  Jinju: "진주",
  "Jinju-si": "진주",
};

export const WeatherProvider = ({ children }) => {
  const [weather, setWeather] = useState(null);
  const [timeState, setTimeState] = useState("afternoon");
  const [loading, setLoading] = useState(true);
  const tzOffsetRef = useRef(null); // API에서 받은 UTC 오프셋(초)

  const updateTimeState = () => {
    let hour;
    if (tzOffsetRef.current !== null) {
      // API timezone 기반 정확한 현지 시각
      hour = Math.floor(((Date.now() / 1000 + tzOffsetRef.current) % 86400) / 3600);
    } else {
      hour = new Date().getHours();
    }
    if (hour >= 2 && hour < 6) setTimeState("dawn");
    else if (hour >= 6 && hour < 12) setTimeState("morning");   // 6~11시 = 아침
    else if (hour >= 12 && hour < 18) setTimeState("afternoon"); // 12~17시 = 오후
    else if (hour >= 18 && hour < 22) setTimeState("evening");  // 18~21시 = 저녁
    else setTimeState("night");                                   // 22~1시 = 밤
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

      // 역지오코딩으로 한국어 지명 직접 획득
      const [geoRes, weatherRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`),
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=kr`),
      ]);
      const [geoData, data] = await Promise.all([geoRes.json(), weatherRes.json()]);

      const cityName = geoData[0]?.local_names?.ko || CITY_NAME_MAP[geoData[0]?.name] || geoData[0]?.name || "현재 위치";

      // API timezone 오프셋 저장 후 시간대 즉시 재계산
      tzOffsetRef.current = data.timezone ?? null;
      updateTimeState();

      setWeather({
        main: data.weather[0].main,
        temp: Math.round(data.main.temp),
        city: cityName,
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
