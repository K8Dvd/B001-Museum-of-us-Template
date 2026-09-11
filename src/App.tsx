import { useEffect, useRef, useState } from "react";
import { museumData } from "./data";
import "./index.css";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

function App() {
  const { exhibits } = museumData;

  const [started, setStarted] = useState(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const [museumProgress, setMuseumProgress] = useState(0);

  const [selectedExhibit, setSelectedExhibit] =
    useState<number | null>(null);

  const [showNote, setShowNote] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const [typedText, setTypedText] = useState("");

  const [musicPlaying, setMusicPlaying] = useState(false);

  const playerRef = useRef<any>(null);

  const activeIndexRef = useRef(0);
  const museumProgressRef = useRef(0);

  const isMovingRef = useRef(false);

  const wheelUnlockRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const animationRef = useRef<number | null>(null);

  /* =====================================================
     KEEP REFS UPDATED
  ===================================================== */

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    museumProgressRef.current = museumProgress;
  }, [museumProgress]);

  /* =====================================================
     YOUTUBE MUSIC
  ===================================================== */

  useEffect(() => {
    if (!started) return;

    const createPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      playerRef.current = new window.YT.Player(
        "youtube-player",
        {
          height: "1",
          width: "1",

          videoId: museumData.song.youtubeId,

          playerVars: {
            autoplay: 1,
            controls: 0,
            loop: 1,
            playlist: museumData.song.youtubeId,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
          },

          events: {
            onReady: (event: any) => {
              event.target.setVolume(45);
              event.target.playVideo();

              setMusicPlaying(true);
            },

            onStateChange: (event: any) => {
              if (
                event.data ===
                window.YT.PlayerState.PLAYING
              ) {
                setMusicPlaying(true);
              }

              if (
                event.data ===
                window.YT.PlayerState.PAUSED
              ) {
                setMusicPlaying(false);
              }
            },
          },
        }
      );
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady =
        createPlayer;

      const script =
        document.createElement("script");

      script.src =
        "https://www.youtube.com/iframe_api";

      script.async = true;

      document.body.appendChild(script);
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }

        playerRef.current = null;
      }
    };
  }, [started]);

  /* =====================================================
     MUSIC TOGGLE
  ===================================================== */

  const toggleMusic = () => {
    if (!playerRef.current) return;

    const state =
      playerRef.current.getPlayerState?.();

    if (
      state ===
      window.YT?.PlayerState?.PLAYING
    ) {
      playerRef.current.pauseVideo();

      setMusicPlaying(false);
    } else {
      playerRef.current.playVideo();

      setMusicPlaying(true);
    }
  };

  /* =====================================================
     CURATOR NOTE TYPING
  ===================================================== */

  useEffect(() => {
    if (!showNote) {
      setTypedText("");
      return;
    }

    const text =
      museumData.curatorNote.trim();

    let index = 0;

    setTypedText("");

    const interval = setInterval(() => {
      index++;

      setTypedText(
        text.slice(0, index)
      );

      if (index >= text.length) {
        clearInterval(interval);
      }
    }, 18);

    return () => {
      clearInterval(interval);
    };
  }, [showNote]);

  /* =====================================================
     MOVE BETWEEN EXHIBITS
  ===================================================== */

  const moveToExhibit = (
    nextIndex: number
  ) => {
    const clampedIndex =
      Math.max(
        0,
        Math.min(
          exhibits.length - 1,
          nextIndex
        )
      );

    if (
      clampedIndex ===
      activeIndexRef.current
    ) {
      return;
    }

    const start =
      museumProgressRef.current;

    const end = clampedIndex;

    const duration = 650;

    const startTime =
      performance.now();

    isMovingRef.current = true;

    setActiveIndex(
      clampedIndex
    );

    if (animationRef.current) {
      cancelAnimationFrame(
        animationRef.current
      );
    }

    const animate = (
      currentTime: number
    ) => {
      const elapsed =
        currentTime - startTime;

      const progress =
        Math.min(
          elapsed / duration,
          1
        );

      const eased =
        progress < 0.5
          ? 2 *
            progress *
            progress
          : 1 -
            Math.pow(
              -2 * progress + 2,
              2
            ) /
              2;

      const value =
        start +
        (end - start) *
          eased;

      museumProgressRef.current =
        value;

      setMuseumProgress(value);

      if (progress < 1) {
        animationRef.current =
          requestAnimationFrame(
            animate
          );
      } else {
        museumProgressRef.current =
          end;

        setMuseumProgress(
          end
        );

        wheelUnlockRef.current =
          setTimeout(() => {
            isMovingRef.current =
              false;
          }, 160);
      }
    };

    animationRef.current =
      requestAnimationFrame(
        animate
      );
  };

  /* =====================================================
     MOUSE WHEEL
  ===================================================== */

  useEffect(() => {
    if (!started) return;

    const handleWheel = (
      event: WheelEvent
    ) => {
      event.preventDefault();

      if (isMovingRef.current) {
        return;
      }

      if (
        Math.abs(event.deltaY) < 20
      ) {
        return;
      }

      const direction =
        event.deltaY > 0
          ? 1
          : -1;

      const currentIndex =
        activeIndexRef.current;

      const nextIndex =
        currentIndex +
        direction;

      if (
        nextIndex < 0 ||
        nextIndex >=
          exhibits.length
      ) {
        return;
      }

      moveToExhibit(
        nextIndex
      );
    };

    window.addEventListener(
      "wheel",
      handleWheel,
      {
        passive: false,
      }
    );

    return () => {
      window.removeEventListener(
        "wheel",
        handleWheel
      );

      if (
        wheelUnlockRef.current
      ) {
        clearTimeout(
          wheelUnlockRef.current
        );
      }

      if (
        animationRef.current
      ) {
        cancelAnimationFrame(
          animationRef.current
        );
      }
    };
  }, [
    started,
    exhibits.length,
  ]);

  /* =====================================================
     KEYBOARD
  ===================================================== */

  useEffect(() => {
    if (!started) return;

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        event.key ===
          "ArrowRight" ||
        event.key ===
          "ArrowDown"
      ) {
        event.preventDefault();

        if (
          isMovingRef.current
        ) {
          return;
        }

        moveToExhibit(
          activeIndexRef.current +
            1
        );
      }

      if (
        event.key ===
          "ArrowLeft" ||
        event.key ===
          "ArrowUp"
      ) {
        event.preventDefault();

        if (
          isMovingRef.current
        ) {
          return;
        }

        moveToExhibit(
          activeIndexRef.current -
            1
        );
      }

      if (
        event.key === "Escape"
      ) {
        setSelectedExhibit(
          null
        );

        setShowNote(false);

        setShowVideo(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [started]);

  /* =====================================================
     ENTRANCE
  ===================================================== */

  if (!started) {
    return (
      <main className="entrance">
        <div className="entrance-glow" />

        <div className="entrance-content">
          <div className="museum-small-label">
            A PRIVATE COLLECTION
          </div>

          <h1>
            Museum
            <span>of Us</span>
          </h1>

          <p className="entrance-subtitle">
            A collection of little
            moments,
            <br />
            memories, and everything
            in between.
          </p>

          <div className="entrance-door">
            <div className="door-sign">
              <span>
                EXHIBITION
              </span>

              <strong>
                OUR STORY
              </strong>

              <small>
                EST.{" "}
                {museumData.couple.date}
              </small>
            </div>
          </div>

          <button
            className="enter-button"
            onClick={() =>
              setStarted(true)
            }
          >
            <span>
              Enter the Museum
            </span>

            <span className="button-arrow">
              →
            </span>
          </button>

          <div className="entrance-hint">
            Best experienced with
            sound.
          </div>
        </div>
      </main>
    );
  }

  /* =====================================================
     MUSEUM
  ===================================================== */

  return (
    <main className="museum">

      {/* Hidden YouTube Player */}

      <div
        id="youtube-player"
        className="youtube-player"
      />

      {/* Decorative Side Lines */}

      <div className="side-line left-line" />
      <div className="side-line right-line" />

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="museum-header">

        <div className="museum-brand">

          <span className="brand-mark">
            ✦
          </span>

          <div>
            <strong>
              THE MUSEUM OF US
            </strong>

            <small>
              A PRIVATE COLLECTION
            </small>
          </div>

        </div>

        <div className="header-actions">

          <button
            className={`music-button ${
              musicPlaying
                ? "playing"
                : ""
            }`}
            onClick={
              toggleMusic
            }
          >

            <span className="music-icon">
              ♫
            </span>

            <span className="music-text">
              {musicPlaying
                ? "Music On"
                : "Music Off"}
            </span>

            {musicPlaying && (
              <span className="music-bars">
                <i />
                <i />
                <i />
                <i />
              </span>
            )}

          </button>

          <button
            className="note-button"
            onClick={() =>
              setShowNote(true)
            }
          >
            <span>
              ✦
            </span>

            Curator's Note
          </button>

        </div>

      </header>

      {/* =================================================
          EXHIBIT COUNTER
      ================================================= */}

      <div className="exhibit-counter">

        <span>
          {String(
            activeIndex + 1
          ).padStart(2, "0")}
        </span>

        <i>/</i>

        <span>
          {String(
            exhibits.length
          ).padStart(2, "0")}
        </span>

      </div>

      {/* =================================================
          EXHIBIT TRACK
      ================================================= */}

      <section className="museum-stage">

        <div
          className="museum-track"
          style={{
            transform:
              `translateX(-${
                museumProgress *
                100
              }vw)`,
          }}
        >

          {exhibits.map(
            (
              exhibit,
              index
            ) => {

              const isLast =
                index ===
                exhibits.length -
                  1;

              return (
                <article
                  className={`exhibit ${
                    index ===
                    activeIndex
                      ? "active"
                      : ""
                  }`}
                  key={index}
                >

                  <div className="museum-room">

                    <div className="wall-light left" />

                    <div className="wall-light right" />

                    <div className="spotlight" />

                    {/* =============================
                        EXHIBIT TITLE
                    ============================== */}

                    <div className="exhibit-heading">

                      <span>
                        EXHIBIT{" "}
                        {exhibit.number}
                      </span>

                      <h2>
                        {exhibit.title}
                      </h2>

                    </div>

                    {/* =============================
                        WALL-MOUNTED ARTWORK
                    ============================== */}

                    <button
                      className="artwork-button"
                      onClick={() =>
                        setSelectedExhibit(
                          index
                        )
                      }
                    >

                      <div className="frame-shadow" />

                      <div className="museum-frame">

                        <div className="frame-gold">

                          <div className="mat">

                            <img
                              src={
                                exhibit.image
                              }
                              alt={
                                exhibit.title
                              }
                            />

                            <div className="photo-glass" />

                          </div>

                        </div>

                      </div>

                      <div className="frame-label">

                        <span>
                          {exhibit.number}
                        </span>

                        <strong>
                          {exhibit.title}
                        </strong>

                        <small>
                          {exhibit.year}
                        </small>

                      </div>

                    </button>

                    {/* =============================
                        FLOOR
                    ============================== */}

                    <div className="museum-floor" />

                    {/* =============================
                        LAST EXHIBIT VIDEO
                    ============================== */}

                    {isLast && (
                      <button
                        className="video-exhibit-button"
                        onClick={() =>
                          setShowVideo(
                            true
                          )
                        }
                      >
                        <span>
                          ▶
                        </span>

                        Moving Memories
                      </button>
                    )}

                    {!isLast && (
                      <div className="scroll-hint">

                        <span>
                          SCROLL TO CONTINUE
                        </span>

                        <div className="scroll-line" />

                        <span>
                          →
                        </span>

                      </div>
                    )}

                  </div>

                </article>
              );
            }
          )}

        </div>

      </section>

      {/* =================================================
          CURATOR NOTE
      ================================================= */}

      {showNote && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowNote(false)
          }
        >

          <div
            className="curator-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="modal-close"
              onClick={() =>
                setShowNote(false)
              }
            >
              ×
            </button>

            <div className="letter-paper">

              <div className="letter-top">

                <div>
                  ✦
                </div>

                <span>
                  THE MUSEUM OF US
                </span>

                <div>
                  ✦
                </div>

              </div>

              <div className="letter-date">
                From the curator's desk
              </div>

              <div className="letter-text">

                {typedText}

                {typedText.length <
                  museumData.curatorNote.trim()
                    .length && (
                  <span className="typing-cursor">
                    |
                  </span>
                )}

              </div>

              <div className="letter-signature">

                With love,

                <strong>
                  Your Favorite Person
                </strong>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          PHOTO DETAIL
      ================================================= */}

      {selectedExhibit !== null && (
        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedExhibit(
              null
            )
          }
        >

          <div
            className="exhibit-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="modal-close"
              onClick={() =>
                setSelectedExhibit(
                  null
                )
              }
            >
              ×
            </button>

            <div className="modal-image">

              <img
                src={
                  exhibits[
                    selectedExhibit
                  ].image
                }
                alt={
                  exhibits[
                    selectedExhibit
                  ].title
                }
              />

            </div>

            <div className="modal-info">

              <span>
                EXHIBIT{" "}
                {
                  exhibits[
                    selectedExhibit
                  ].number
                }
              </span>

              <h2>
                {
                  exhibits[
                    selectedExhibit
                  ].title
                }
              </h2>

              <small>
                {
                  exhibits[
                    selectedExhibit
                  ].year
                }
              </small>

              <div className="modal-divider" />

              <p>
                {
                  exhibits[
                    selectedExhibit
                  ].description
                }
              </p>

              <em>
                "Some memories deserve
                to be displayed forever."
              </em>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          VIDEO
      ================================================= */}

      {showVideo && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowVideo(false)
          }
        >

          <div
            className="video-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="modal-close"
              onClick={() =>
                setShowVideo(false)
              }
            >
              ×
            </button>

            <div className="video-frame">

              <video
                src={
                  museumData.video.src
                }
                controls
                playsInline
              />

            </div>

            <div className="video-info">

              <span>
                MOVING MEMORIES
              </span>

              <h2>
                {
                  museumData.video.title
                }
              </h2>

              <p>
                {
                  museumData.video
                    .description
                }
              </p>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}

export default App;