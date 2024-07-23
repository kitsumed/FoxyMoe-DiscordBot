/**
 * Return a array sliced by pages. Page number start at 1 and goes up.
 * @param {Array} array Array to slice
 * @param {Number} itemsPerPage Numbers of array items per page
 * @param {Number} pageNum The page to return
 * @returns {Array} The sliced array
 */
const Paginate = (array, itemsPerPage, pageNum) => {
    // Remove one to itemsPerPage to get everything from the end of the "page before" to the new page end
    const startFromItem = itemsPerPage * (pageNum - 1)
    const endAtItem = itemsPerPage * pageNum
    return array.slice(startFromItem, endAtItem)
}

module.exports = { Paginate }