'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const SUIT_ORDER = ['p', 's', 'm', 'z', 'q'];

const buildTiles = () => {
  const tiles = [];

  const addRange = (suit, maxNumber, maxCopies) => {
    for (let value = 1; value <= maxNumber; value += 1) {
      tiles.push({
        id: `Mpu${value}${suit}`,
        suit,
        value,
        maxCopies,
        name: `${value}${suit.toUpperCase()}`,
        path: `./tiles/Mpu${value}${suit}.svg`,
      });
    }
  };

  addRange('p', 9, 4);
  addRange('s', 9, 4);
  addRange('m', 9, 4);
  addRange('z', 7, 4);
  addRange('q', 8, 1);

  return tiles;
};

const ALL_TILES = buildTiles();
const TILE_LOOKUP = ALL_TILES.reduce((acc, tile) => ({ ...acc, [tile.id]: tile }), {});
const TILES_BY_SUIT = SUIT_ORDER.reduce((acc, suit) => {
  acc[suit] = ALL_TILES.filter((tile) => tile.suit === suit);
  return acc;
}, {});

const compareTiles = (aId, bId) => {
  const a = TILE_LOOKUP[aId];
  const b = TILE_LOOKUP[bId];
  if (!a || !b) return 0;
  const suitDiff = SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit);
  if (suitDiff !== 0) return suitDiff;
  return a.value - b.value;
};

export default function HomePage() {
  const [selectedItems, setSelectedItems] = useState([]);
  const [historySize, setHistorySize] = useState(0);
  const [hideSpacers, setHideSpacers] = useState(false);
  const selectionRef = useRef(null);
  const dragIndexRef = useRef(null);
  const historyRef = useRef([]);

  const counts = useMemo(() => {
    return selectedItems.reduce((acc, item) => {
      if (item.kind !== 'tile') return acc;
      acc[item.id] = (acc[item.id] || 0) + 1;
      return acc;
    }, {});
  }, [selectedItems]);

  const updateSelection = useCallback((updater) => {
    setSelectedItems((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (next === prev) return prev;
      historyRef.current.push(prev);
      setHistorySize(historyRef.current.length);
      return next;
    });
  }, []);

  const handleAdd = (tileId) => {
    const tile = TILE_LOOKUP[tileId];
    const currentCount = counts[tileId] || 0;
    if (currentCount >= tile.maxCopies) return;
    updateSelection((prev) => [
      ...prev,
      {
        kind: 'tile',
        id: tileId,
        uid: `tile-${tileId}-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(16).slice(2)}`,
      },
    ]);
  };

  const handleRemoveAt = (indexToRemove) => {
    updateSelection((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUndo = useCallback(() => {
    setSelectedItems((prev) => {
      if (historyRef.current.length === 0) return prev;
      const lastState = historyRef.current.pop();
      setHistorySize(historyRef.current.length);
      return lastState;
    });
  }, []);

  const handleAddSpacer = () => {
    updateSelection((prev) => [
      ...prev,
      {
        kind: 'spacer',
        uid: `spacer-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(16).slice(2)}`,
      },
    ]);
  };

  const handleAddNewline = () => {
    updateSelection((prev) => [
      ...prev,
      {
        kind: 'newline',
        uid: `newline-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(16).slice(2)}`,
      },
    ]);
  };

  const handleResetSelection = () => {
    if (selectedItems.length === 0) return;
    updateSelection(() => []);
  };

  const handleSortSelection = () => {
    if (totalTiles === 0) return;
    updateSelection((prev) => {
      const tilesOnly = prev
        .filter((item) => item.kind === 'tile')
        .sort((a, b) => compareTiles(a.id, b.id));
      let tileIndex = 0;
      return prev.map((item) => {
        if (item.kind !== 'tile') return item;
        const nextTile = tilesOnly[tileIndex];
        tileIndex += 1;
        return nextTile;
      });
    });
  };

  const handleDownload = async () => {
    if (!selectionRef.current || totalTiles === 0) return;
    setHideSpacers(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(selectionRef.current, {
        backgroundColor: null,
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = 'mahjong-selection.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setHideSpacers(false);
    }
  };

  const selectedTiles = selectedItems.map((item, idx) => {
    if (item.kind === 'spacer') return { kind: 'spacer', key: item.uid, index: idx };
    if (item.kind === 'newline') return { kind: 'newline', key: item.uid, index: idx };
    return { ...TILE_LOOKUP[item.id], kind: 'tile', key: item.uid, index: idx };
  });
  const totalTiles = selectedItems.filter((item) => item.kind === 'tile').length;

  useEffect(() => {
    const isEditableTarget = (target) => {
      if (!(target instanceof HTMLElement)) return false;
      const tagName = target.tagName;
      return (
        target.isContentEditable ||
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT'
      );
    };

    const handleKeyDown = (event) => {
      if (event.key !== 'Backspace' && event.key !== 'Delete') return;
      if (historyRef.current.length === 0) return;
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      handleUndo();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo]);

  const handleDragStart = (event, index) => {
    dragIndexRef.current = index;
    const imgEl = event.currentTarget?.querySelector('img');
    if (imgEl && event.dataTransfer) {
      const clone = imgEl.cloneNode(true);
      Object.assign(clone.style, {
        position: 'absolute',
        top: '-9999px',
        left: '-9999px',
        background: 'white',
        borderRadius: '10% / 7%',
        padding: '6px',
        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.25)',
        width: `${imgEl.clientWidth}px`,
        height: `${imgEl.clientHeight}px`,
      });
      document.body.appendChild(clone);
      event.dataTransfer.setDragImage(clone, imgEl.clientWidth / 2, imgEl.clientHeight / 2);
      requestAnimationFrame(() => clone.remove());
    }
  };

  const handleDrop = (targetIndex) => {
    const fromIndex = dragIndexRef.current;
    dragIndexRef.current = null;
    if (fromIndex === null || fromIndex === targetIndex) return;
    updateSelection((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  return (
    <main className="main">
      <header className="header">
        <div>
          <h1 className="title">Mahjong Tile Generator</h1>
        </div>
      </header>

      <section className="selector">
        <div className="tile-bar">
          <h3>
            Selected tiles <span className="badge">{totalTiles}</span>
          </h3>
          <span className="meta">
            Drag to reorder. Sort uses Mahjong order: p → s → m → honors → flowers
          </span>
        </div>
        <div className="actions" style={{ marginBottom: 12 }}>
          <button className="btn ghost" onClick={handleAddSpacer} aria-label="Add spacer">
            Add spacer
          </button>
          <button className="btn ghost" onClick={handleAddNewline} aria-label="Add new line">
            New line
          </button>
          <button
            className="btn ghost"
            onClick={handleResetSelection}
            disabled={selectedTiles.length === 0}
            aria-label="Clear selection"
          >
            Reset
          </button>
          <button
            className="btn ghost"
            onClick={handleUndo}
            disabled={historySize === 0}
            aria-label="Undo last action"
          >
            Undo
          </button>
        </div>
        <div
          ref={selectionRef}
          className={`selected-tiles${hideSpacers ? ' hide-spacers' : ''}`}
          aria-live="polite"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(selectedTiles.length)}
        >
          {selectedTiles.length === 0 && (
            <p className="notice">Nothing yet—tap tiles below to add them.</p>
          )}
          {(() => {
            const rows = [];
            let currentRow = [];
            selectedTiles.forEach((item) => {
              if (item.kind === 'newline') {
                rows.push({ type: 'tiles', items: currentRow });
                rows.push({ type: 'newline', item });
                currentRow = [];
              } else {
                currentRow.push(item);
              }
            });
            if (currentRow.length > 0 || rows.length === 0) {
              rows.push({ type: 'tiles', items: currentRow });
            }

            return rows.map((row, rowIdx) => {
              if (row.type === 'newline') {
                const nl = row.item;
                return (
                  <div
                    key={nl.key}
                    className="line-break clickable"
                    onClick={() => handleRemoveAt(nl.index)}
                    aria-label="Remove line break"
                    title="Click to remove line break"
                  >
                    <span className="line-break-bar"></span>
                  </div>
                );
              }

              return (
                <div key={`row-${rowIdx}`} className="selected-row">
                  {row.items.map((tile) => (
                    <button
                      key={tile.key}
                      className={`tile clickable${tile.kind === 'spacer' ? ' spacer' : ''}`}
                      onClick={() => handleRemoveAt(tile.index)}
                      aria-label={tile.kind === 'spacer' ? 'Remove spacer' : `Remove ${tile.name}`}
                      title={
                        tile.kind === 'spacer'
                          ? 'Click to remove spacer'
                          : 'Click to remove this tile'
                      }
                      draggable
                      onDragStart={(e) => handleDragStart(e, tile.index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(tile.index)}
                    >
                      {tile.kind === 'spacer' ? (
                        <span className="spacer-bar">
                          <img src="./tiles/Mpu00.svg" />
                        </span>
                      ) : (
                        <img src={tile.path} alt={tile.name} />
                      )}
                    </button>
                  ))}
                </div>
              );
            });
          })()}
        </div>
      </section>
      <section>
        <div className="actions">
          <button
            className="btn secondary"
            onClick={handleSortSelection}
            disabled={totalTiles === 0}
            aria-label="Sort selected tiles"
          >
            Sort selection
          </button>
          <button
            className="btn"
            onClick={handleDownload}
            disabled={totalTiles === 0}
            aria-label="Download selected tiles as image"
          >
            Download image
          </button>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <div className="tile-bar" style={{ marginBottom: 12 }}>
          <h3>Tile catalog</h3>
          <span className="meta">Tap any tile to add it</span>
        </div>
        <div className="catalog">
          {SUIT_ORDER.map((suit) => (
            <div key={suit} className="catalog-row">
              {TILES_BY_SUIT[suit].map((tile) => {
                const count = counts[tile.id] || 0;
                const atCap = count >= tile.maxCopies;
                return (
                  <button
                    key={tile.id}
                    className={`card tile-card${atCap ? ' disabled' : ''}`}
                    onClick={() => handleAdd(tile.id)}
                    disabled={atCap}
                    aria-label={`Add ${tile.name}`}
                    title={atCap ? 'Reached max copies' : 'Add tile'}
                  >
                    <img src={tile.path} alt={tile.name} loading="lazy" />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
