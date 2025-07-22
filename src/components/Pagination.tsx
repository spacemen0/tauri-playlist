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
            className={`pagination_btn ${
              currentPage === i ? "bg-orange-500" : "bg-white"
            }`}
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
          className={`pagination_btn ${
            currentPage === 1 ? "bg-orange-500" : "bg-white"
          }`}
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
            className={`pagination_btn ${
              currentPage === i ? "bg-orange-500" : "bg-white"
            }`}
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
          className={`pagination_btn ${
            currentPage === totalPages ? "bg-orange-500" : "bg-white"
          }`}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="flex justify-center flex-wrap mb-2">
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
        className="mr-2 py-2 px-2 border rounded w-20 text-center text-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-orange-700 focus:border-none"
      />
      <button onClick={handleJump} className="btn ">
        Go
      </button>
    </div>
  );
}

export default Pagination;
