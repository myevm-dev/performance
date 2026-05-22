type StoreOption = {
  id: string
  storeNumber: string
  label: string
}

type HomeStoreModalProps = {
  open: boolean
  stores: StoreOption[]
  search: string
  setSearch: (value: string) => void
  selectedStore: string
  setSelectedStore: (value: string) => void
  onConfirm: () => void
}

export default function HomeStoreModal({
  open,
  stores,
  search,
  setSearch,
  selectedStore,
  setSelectedStore,
  onConfirm,
}: HomeStoreModalProps) {
  if (!open) return null

  const query = search.toLowerCase().trim()

  const filtered =
    query.length === 0
      ? []
      : stores
          .filter((store) => {
            return (
              store.storeNumber.toLowerCase().includes(query) ||
              store.label.toLowerCase().includes(query)
            )
          })
          .slice(0, 8)

  return (
    <div className="modalOverlay" role="presentation">
      <div
        className="modalCard"
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: 560 }}
      >
        <div className="modalHeader">
          <div />
          <div className="modalHeaderCenter">
            <div className="modalTitle">Choose your home store</div>
            <div className="modalSub">You can change this later</div>
          </div>
          <div style={{ width: 40 }} />
        </div>

        <div className="modalBody">
          <div className="panel">
            <div className="panelTitle">Search stores</div>

            <div style={{ position: "relative", marginTop: 12 }}>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setSelectedStore("")
                }}
                placeholder="Search by name or store number"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)",
                  color: "white",
                  outline: "none",
                }}
              />

              {filtered.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: 0,
                    right: 0,
                    zIndex: 20,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(10,10,16,0.98)",
                    boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
                    overflow: "hidden",
                  }}
                >
                  {filtered.map((store, idx) => (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => {
                        setSelectedStore(store.storeNumber)
                        setSearch(`${store.label} (#${store.storeNumber})`)
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "12px 14px",
                        border: "none",
                        borderBottom:
                          idx === filtered.length - 1
                            ? "none"
                            : "1px solid rgba(255,255,255,0.06)",
                        background: "transparent",
                        color: "white",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: 800 }}>{store.label}</div>
                      <div style={{ fontSize: 12, opacity: 0.72 }}>
                        #{store.storeNumber}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedStore && (
              <div
                style={{
                  marginTop: 16,
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                  Selected store
                </div>
                <div style={{ fontWeight: 500, color: "cyan" }}>{search}</div>
              </div>
            )}

            <button
              type="button"
              onClick={onConfirm}
              disabled={!selectedStore}
              style={{
                marginTop: 16,
                width: "100%",
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: selectedStore
                  ? "linear-gradient(90deg, rgba(253,1,245,0.22), rgba(1,252,252,0.18))"
                  : "rgba(255,255,255,0.08)",
                color: "white",
                fontWeight: 800,
                cursor: selectedStore ? "pointer" : "not-allowed",
                opacity: selectedStore ? 1 : 0.6,
              }}
            >
              Save Home Store
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}