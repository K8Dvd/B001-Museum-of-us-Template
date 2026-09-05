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
  const { couple, curatorNote, exhibits, song } = museumData;

  const [started, setStarted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedExhibit, setSelectedExhibit] = useState<number | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [typedText, setTypedText] = useState("");

  const playerRef = useRef<any>(null);
  const wheelLock = useRef(false);
  const noteStarted = useRef(false);

  /*
   * ==========================================
   * YOUTUBE MUSIC
   * ==========================================
   */

  useEffect(() => {
    if (!started) return;

    const createPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      playerRef.current = new window.YT.Player("youtube-player", {
        height: "1",
        width: "1",
        videoId: song.youtubeId,
        playerVars: {
          autoplay: 1,
          loop: 1,
          playlist: song.youtubeId,
          controls: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(45);
            event.target.playVideo();
          },
        },
      });
    };

    if (!window.YT) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);

      window.onYouTubeIframeAPIReady = createPlayer;
    } else {
      createPlayer();
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
      }
    };
  }, [started, song.youtubeId]);

  /*
   * ==========================================
   * CURATOR LETTER TYPING
   * ==========================================
   */

  useEffect(() => {
    if (!showNote || noteStarted.current) return;

    noteStarted.current = true;

    let index = 0;

    const interval = setInterval(() => {
      if (index >= curatorNote.length) {
        clearInterval(interval);
        return;
      }

      setTypedText(curatorNote.slice(0, index + 1));
      index++;
    }, 28);

    return () => clearInterval(interval);
  }, [showNote, curatorNote]);

  /*
   * ==========================================
   * SCROLL → HORIZONTAL MOVEMENT
   * ==========================================
   */

  useEffect(() => {
    if (!started) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      if (wheelLock.current) return;

      const direction = event.deltaY > 0 ? 1 : -1;

      let next = activeIndex + direction;

      if (next < 0) next = 0;

      if (next > exhibits.length - 1) {
        next = exhibits.length - 1;
      }

      if (next === activeIndex) return;

      wheelLock.current = true;

      setActiveIndex(next);

      setTimeout(() => {
        wheelLock.current = false;
      }, 500);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [started, activeIndex, exhibits.length]);

  /*
   * ==========================================
   * KEYBOARD SUPPORT
   * ==========================================
   */

  useEffect(() => {
    if (!started) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        setActiveIndex((prev) =>
          Math.min(prev + 1, exhibits.length - 1)
        );
      }

      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [started, exhibits.length]);

  /*
   * ==========================================
   * START MUSEUM
   * ==========================================
   */

  const enterMuseum = () => {
    setStarted(true);
    setShowNote(true);
  };

  /*
   * ==========================================
   * ENTRANCE
   * ==========================================
   */

  if (!started) {
    return (
      <main className="entrance">
        <div className="entrance-glow" />

        <div className="entrance-content">
          <div className="museum-small-label">
            EST. {couple.date}
          </div>

          <h1>
            The Museum
            <span>of Us</span>
          </h1>

          <p className="entrance-subtitle">
            A collection of moments,
            <br />
            memories &amp; little pieces of forever.
          </p>

          <div className="entrance-door">
            <div className="door-sign">
              <span>PRIVATE COLLECTION</span>
              <strong>THE MUSEUM OF US</strong>
              <small>ADMISSION BY INVITATION ONLY</small>
            </div>

            <div className="door-light" />
          </div>

          <button className="enter-button" onClick={enterMuseum}>
            <span>Enter the Museum</span>
            <span className="button-arrow">→</span>
          </button>

          <div className="entrance-hint">
            Please wear your heart on your sleeve.
          </div>
        </div>
      </main>
    );
  }

  /*
   * ==========================================
   * MUSEUM
   * ==========================================
   */

  return (
    <main className="museum">
      <div id="youtube-player" className="youtube-player" />

      {/* TOP UI */}

      <header className="museum-header">
        <div className="museum-brand">
          <span className="brand-mark">✦</span>

          <div>
            <strong>MUSEUM OF US</strong>
            <small>PRIVATE COLLECTION</small>
          </div>
        </div>

        <button
          className="note-button"
          onClick={() => setShowNote(true)}
        >
          <span>✎</span>
          Curator's Note
        </button>
      </header>

      {/* EXHIBIT COUNTER */}

      <div className="exhibit-counter">
        <span>
          {String(activeIndex + 1).padStart(2, "0")}
        </span>

        <i>/</i>

        <span>
          {String(exhibits.length).padStart(2, "0")}
        </span>
      </div>

      {/* HORIZONTAL MUSEUM */}

      <section className="museum-stage">
        <div
          className="museum-track"
          style={{
            transform: `translateX(-${activeIndex * 100}vw)`,
          }}
        >
          {exhibits.map((exhibit, index) => (
            <article
              className={`exhibit ${
                index === activeIndex ? "active" : ""
              }`}
              key={exhibit.number}
            >
              {/* SPOTLIGHT */}

              <div className="spotlight" />

              {/* ROOM */}

              <div className="museum-room">
                <div className="wall-light left" />
                <div className="wall-light right" />

                {/* TITLE */}

                <div className="exhibit-heading">
                  <span>EXHIBIT {exhibit.number}</span>
                  <h2>{exhibit.title}</h2>
                </div>

                {/* ARTWORK */}

                <button
                  className="artwork-button"
                  onClick={() => setSelectedExhibit(index)}
                  aria-label={`Open ${exhibit.title}`}
                >
                  <div className="frame-shadow" />

                  <div className="museum-frame">
                    <div className="frame-gold outer">
                      <div className="frame-gold inner">
                        <div className="mat">
                          <img
                            src={exhibit.image}
                            alt={exhibit.title}
                          />

                          <div className="photo-glass" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="frame-label">
                    <span>{exhibit.number}</span>

                    <strong>{exhibit.title}</strong>

                    <small>{exhibit.year}</small>
                  </div>
                </button>

                {/* PEDESTAL */}

                <div className="pedestal">
                  <div className="pedestal-top" />

                  <div className="pedestal-body">
                    <span />
                    <span />
                  </div>

                  <div className="pedestal-base" />
                </div>

                {/* PLAQUE */}

                <div className="plaque">
                  <span>COLLECTION</span>
                  <strong>{exhibit.number}</strong>
                </div>

                {/* FLOOR */}

                <div className="museum-floor" />

                {/* NEXT HINT */}

                {index < exhibits.length - 1 && (
                  <div className="scroll-hint">
                    <span>SCROLL TO CONTINUE</span>
                    <div className="scroll-line" />
                  </div>
                )}

                {index === exhibits.length - 1 && (
                  <button
                    className="finish-button"
                    onClick={() => setSelectedExhibit(index)}
                  >
                    <span>Finish the collection</span>
                    <strong>→</strong>
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* SIDE DECOR */}

      <div className="side-line left-line" />
      <div className="side-line right-line" />

      {/* CURATOR NOTE */}

      {showNote && (
        <div
          className="modal-overlay"
          onClick={() => setShowNote(false)}
        >
          <div
            className="curator-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setShowNote(false)}
            >
              ×
            </button>

            <div className="letter-top">
              <span>THE CURATOR'S NOTE</span>
              <div>✦</div>
            </div>

            <div className="letter-paper">
              <div className="letter-date">
                {couple.date}
              </div>

              <div className="letter-text">
                {typedText}
                <span className="typing-cursor">|</span>
              </div>

              <div className="letter-signature">
                With love,
                <strong>{couple.name1} &amp; {couple.name2}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXHIBIT MODAL */}

      {selectedExhibit !== null && (
        <div
          className="modal-overlay exhibit-modal-overlay"
          onClick={() => setSelectedExhibit(null)}
        >
          <div
            className="exhibit-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setSelectedExhibit(null)}
            >
              ×
            </button>

            <div className="modal-image">
              <img
                src={exhibits[selectedExhibit].image}
                alt={exhibits[selectedExhibit].title}
              />
            </div>

            <div className="modal-info">
              <span>
                EXHIBIT {exhibits[selectedExhibit].number}
              </span>

              <h2>
                {exhibits[selectedExhibit].title}
              </h2>

              <small>
                {exhibits[selectedExhibit].year}
              </small>

              <p>
                {exhibits[selectedExhibit].description}
              </p>

              <div className="modal-divider" />

              <em>
                "Some memories deserve their own
                room in the museum."
              </em>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;