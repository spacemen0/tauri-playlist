interface PaginationProps {
  currentPage: number;
  totalPages: number;
  paginate: (pageNumber: number) => void;
  jumpPage: number | "";
  setJumpPage: (page: number | "") => void;
  handleJump: () => void;
}

function Pagination({
  currentPage,
  totalPages,
  paginate,
  jumpPage,
  setJumpPage,
  handleJump,
}: PaginationProps) {
  const renderPages = () => {
    const pages = [];

    if (totalPages <= 10) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <button
            key={i}
            onClick={() => {
              paginate(i);
            }}
            className={`page-item ${currentPage === i ? "active" : ""}`}
          >
            {i}
          </button>
        );
      }
    } else {
      pages.push(
        <button
          key={1}
          onClick={() => paginate(1)}
          className={`page-item ${currentPage === 1 ? "active" : ""}`}
        >
          1
        </button>
      );

      if (currentPage > 4) {
        pages.push(
          <span key="start-ellipsis" className="ellipsis">
            ...
          </span>
        );
      }

      const startPage = Math.max(2, currentPage - 2);
      const endPage = Math.min(totalPages - 1, currentPage + 2);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(
          <button
            key={i}
            onClick={() => paginate(i)}
            className={`page-item ${currentPage === i ? "active" : ""}`}
          >
            {i}
          </button>
        );
      }

      if (currentPage < totalPages - 3) {
        pages.push(
          <span key="end-ellipsis" className="ellipsis">
            ...
          </span>
        );
      }

      pages.push(
        <button
          key={totalPages}
          onClick={() => paginate(totalPages)}
          className={`page-item ${currentPage === totalPages ? "active" : ""}`}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="pagination">
      {renderPages()}
      <input
        min="1"
        max={totalPages}
        value={jumpPage}
        onChange={(e) => {
          const value = e.target.value;
          if (value === "") {
            setJumpPage("");
          } else if (
            !isNaN(Number(value)) &&
            Number(value) > 0 &&
            Number(value) <= totalPages
          ) {
            setJumpPage(Number(value));
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleJump();
          }
        }}
        placeholder="Jump"
        className="m-[5px] p-1 border rounded w-16 text-center bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#975508] focus:border-transparent"
      />
      <button
        onClick={handleJump}
        className=" m-[5px] px-2 rounded bg-[#e78534] text-black hover:bg-[#975508]"
      >
        Go
      </button>
    </div>
  );
}

export default Pagination;
