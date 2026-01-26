// Updated: 2026-01-22 17:18 - DD/MM/YYYY format
export const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return ''
    const date = new Date(dateString)

    // Check for invalid date
    if (isNaN(date.getTime())) return dateString

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()

    const formatted = includeTime
        ? `${day}/${month}/${year} ${date.toLocaleTimeString()}`
        : `${day}/${month}/${year}`

    // console.log('formatDate:', dateString, '->', formatted);
    return formatted
}
