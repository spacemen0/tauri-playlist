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
            className={`m-1.5 py-2 px-3 bg-white text-black border-none rounded-md cursor-pointer text-lg hover:bg-orange-700 md:py-1.5 md:px-3 md:text-base ${
              currentPage === i ? "bg-orange-500" : ""
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
          className={`m-1.5 py-2 px-3  text-black border-none rounded-md cursor-pointer text-lg hover:bg-orange-700 md:py-1.5 md:px-3 md:text-base ${
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
            className={`m-1.5 py-2 px-3  text-black border-none rounded-md cursor-pointer text-lg hover:bg-orange-700 md:py-1.5 md:px-3 md:text-base ${
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
          className={`m-1.5 py-2 px-3  text-black border-none rounded-md cursor-pointer text-lg hover:bg-orange-700 md:py-1.5 md:px-3 md:text-base ${
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
        className="m-1.5 p-1 border rounded w-16 text-center bg-white text-black focus:outline-none focus:ring-2 focus:ring-orange-700 focus:border-none"
      />
      <button
        onClick={handleJump}
        className="m-1.5 px-2 rounded bg-orange-500 text-black hover:bg-orange-700"
      >
        Go
      </button>
    </div>
  );
}

export default Pagination;
