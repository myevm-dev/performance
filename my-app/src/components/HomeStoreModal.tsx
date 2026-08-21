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
          .filter(
            (store) =>
              store.storeNumber.toLowerCase().includes(query) ||
              store.label.toLowerCase().includes(query),
          )
          .slice(0, 8)

  return (
    <div className="modalOverlay" role="presentation">
      <div className="modalCard" role="dialog" aria-modal="true">
        <div className="modalHeader">
          <div className="modalTitle">Choose your home store</div>
          <div className="modalSub">You can change this later</div>
        </div>

        <div className="modalBody">
          <div className="panel">
            <div className="panelTitle">Search stores</div>

            <div className="homeStoreSearchWrap">
              <input
                className="homeStoreSearchInput"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setSelectedStore("")
                }}
                placeholder="Search by name or store number"
                autoComplete="off"
              />

              {!selectedStore && filtered.length > 0 && (
                <div className="homeStoreResults">
                  {filtered.map((store) => (
                    <button
                      key={store.id}
                      type="button"
                      className="homeStoreResult"
                      onClick={() => {
                        setSelectedStore(store.storeNumber)
                        setSearch(`${store.label} (#${store.storeNumber})`)
                      }}
                    >
                      <span className="homeStoreResultName">
                        {store.label}
                      </span>

                      <span className="homeStoreResultNumber">
                        #{store.storeNumber}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedStore && (
              <div className="homeStoreSelection">
                <div className="homeStoreSelectionLabel">
                  Selected store
                </div>

                <div className="homeStoreSelectionValue">{search}</div>
              </div>
            )}

            <button
              type="button"
              className="homeStoreSaveButton"
              onClick={onConfirm}
              disabled={!selectedStore}
            >
              Save Home Store
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}