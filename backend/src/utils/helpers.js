const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate random ID
const generateId = (prefix = '') => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}${timestamp}${random}`.toUpperCase();
};

// Generate random token
const generateToken = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

// Format date
const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
};

// Calculate duration between two dates
const getDuration = (startDate, endDate, unit = 'hours') => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end - start;
    
    switch (unit) {
        case 'milliseconds':
            return diff;
        case 'seconds':
            return diff / 1000;
        case 'minutes':
            return diff / (1000 * 60);
        case 'hours':
            return diff / (1000 * 60 * 60);
        case 'days':
            return diff / (1000 * 60 * 60 * 24);
        default:
            return diff;
    }
};

// Format duration
const formatDuration = (minutes) => {
    if (minutes < 60) {
        return `${Math.round(minutes)} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    if (hours < 24) {
        return `${hours}h ${remainingMinutes}m`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h ${remainingMinutes}m`;
};

// Validate email
const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// Validate phone number
const isValidPhone = (phone) => {
    const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return re.test(phone);
};

// Validate URL
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

// Sanitize string
const sanitizeString = (str) => {
    if (!str) return '';
    return str
        .replace(/[&<>"']/g, (match) => {
            const escapeMap = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;'
            };
            return escapeMap[match];
        });
};

// Truncate string
const truncateString = (str, length = 100, suffix = '...') => {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + suffix;
};

// Parse query parameters
const parseQueryParams = (query) => {
    const params = {};
    for (const [key, value] of Object.entries(query)) {
        if (value === 'true') params[key] = true;
        else if (value === 'false') params[key] = false;
        else if (!isNaN(value) && value !== '') params[key] = Number(value);
        else params[key] = value;
    }
    return params;
};

// Build pagination metadata
const buildPagination = (total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    return {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
    };
};

// Calculate percentage
const calculatePercentage = (value, total) => {
    if (total === 0) return 0;
    return (value / total) * 100;
};

// Get status color
const getStatusColor = (status) => {
    const colors = {
        // System statuses
        operational: '#28a745',
        maintenance: '#ffc107',
        degraded: '#fd7e14',
        offline: '#dc3545',
        decommissioned: '#6c757d',
        // Task statuses
        draft: '#6c757d',
        pending_approval: '#ffc107',
        approved: '#17a2b8',
        in_progress: '#0d6efd',
        awaiting_part: '#fd7e14',
        completed: '#28a745',
        cancelled: '#dc3545',
        on_hold: '#6c757d',
        // Incident statuses
        reported: '#dc3545',
        investigating: '#ffc107',
        resolved: '#28a745',
        closed: '#6c757d',
        escalated: '#dc3545'
    };
    return colors[status] || '#6c757d';
};

// Get priority color
const getPriorityColor = (priority) => {
    const colors = {
        critical: '#dc3545',
        high: '#fd7e14',
        medium: '#ffc107',
        low: '#28a745'
    };
    return colors[priority] || '#6c757d';
};

// Get severity color
const getSeverityColor = (severity) => {
    const colors = {
        critical: '#dc3545',
        high: '#fd7e14',
        medium: '#ffc107',
        low: '#28a745'
    };
    return colors[severity] || '#6c757d';
};

// Deep clone object
const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};

// Merge objects
const mergeObjects = (target, source) => {
    const result = { ...target };
    for (const [key, value] of Object.entries(source)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            result[key] = mergeObjects(target[key] || {}, value);
        } else {
            result[key] = value;
        }
    }
    return result;
};

// Generate CSV from array of objects
const generateCSV = (data, headers) => {
    if (!data || data.length === 0) return '';
    
    const headerRow = headers ? headers.join(',') : Object.keys(data[0]).join(',');
    const rows = data.map(item => {
        return Object.values(item).map(value => {
            if (typeof value === 'string' && value.includes(',')) {
                return `"${value}"`;
            }
            return value;
        }).join(',');
    });
    
    return [headerRow, ...rows].join('\n');
};

// Generate unique filename
const generateUniqueFilename = (originalName) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(originalName);
    const name = path.basename(originalName, extension);
    return `${name}_${timestamp}_${random}${extension}`;
};

// Ensure directory exists
const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// Delete file if exists
const deleteFileIfExists = (filePath) => {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
    }
    return false;
};

// Get file size in bytes
const getFileSize = (filePath) => {
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        return stats.size;
    }
    return 0;
};

// Format file size
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Sleep/delay
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// Retry function
const retry = async (fn, retries = 3, delay = 1000) => {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (i < retries - 1) {
                await sleep(delay * (i + 1));
            }
        }
    }
    throw lastError;
};

// Extract error message
const getErrorMessage = (error) => {
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.response && error.response.data && error.response.data.message) {
        return error.response.data.message;
    }
    return 'An unexpected error occurred';
};

// Check if value is empty
const isEmpty = (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
};

// Mask sensitive data
const maskSensitiveData = (data, fields = ['password', 'token', 'secret']) => {
    const masked = { ...data };
    for (const field of fields) {
        if (masked[field]) {
            masked[field] = '********';
        }
    }
    return masked;
};

module.exports = {
    generateId,
    generateToken,
    formatDate,
    getDuration,
    formatDuration,
    isValidEmail,
    isValidPhone,
    isValidUrl,
    sanitizeString,
    truncateString,
    parseQueryParams,
    buildPagination,
    calculatePercentage,
    getStatusColor,
    getPriorityColor,
    getSeverityColor,
    deepClone,
    mergeObjects,
    generateCSV,
    generateUniqueFilename,
    ensureDirectoryExists,
    deleteFileIfExists,
    getFileSize,
    formatFileSize,
    sleep,
    retry,
    getErrorMessage,
    isEmpty,
    maskSensitiveData
};