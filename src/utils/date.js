export const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return ''
    const date = new Date(dateString)

    // Check for invalid date
    if (isNaN(date.getTime())) return dateString

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()

    if (includeTime) {
        return `${day}-${month}-${year} ${date.toLocaleTimeString()}`
    }

    return `${day}-${month}-${year}`
}
