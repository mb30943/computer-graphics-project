// ============================================
// FINDZZER 3D EVENT EXPLORER
// Event Data Module
// ============================================

// Sample event data for Skopje
// Each event has position coordinates, color, and details

export const eventData = [
    {
        id: 1,
        name: "Summer Music Festival",
        date: "July 15, 2025",
        category: "Music",
        description: "An amazing outdoor music festival featuring local and international artists performing live on multiple stages.",
        position: { x: -10, y: 0, z: 5 },
        color: 0xff6b6b,
        icon: "🎵"
    },
    {
        id: 2,
        name: "Tech Conference 2025",
        date: "August 20, 2025",
        category: "Technology",
        description: "A cutting-edge conference bringing together tech enthusiasts, developers, and industry leaders for workshops and networking.",
        position: { x: 15, y: 0, z: -8 },
        color: 0x4ecdc4,
        icon: "💻"
    },
    {
        id: 3,
        name: "Food & Wine Expo",
        date: "September 5, 2025",
        category: "Food",
        description: "Taste the best cuisine and wines from around the region. Local chefs and international culinary experts showcasing their creations.",
        position: { x: -5, y: 0, z: -12 },
        color: 0xffe66d,
        icon: "🍷"
    },
    {
        id: 4,
        name: "Art Gallery Opening",
        date: "October 10, 2025",
        category: "Arts",
        description: "Contemporary art exhibition featuring emerging artists from the Balkans region. Includes live painting demonstrations and artist talks.",
        position: { x: 8, y: 0, z: 10 },
        color: 0xa8e6cf,
        icon: "🎨"
    },
    {
        id: 5,
        name: "Marathon Run",
        date: "November 1, 2025",
        category: "Sports",
        description: "Annual city marathon open to all fitness levels. 5K, 10K, and full marathon routes available. All participants receive medals and refreshments.",
        position: { x: -15, y: 0, z: -5 },
        color: 0xff8b94,
        icon: "🏃"
    },
    {
        id: 6,
        name: "Film Festival",
        date: "December 12, 2025",
        category: "Entertainment",
        description: "International film screenings featuring documentaries, indie films, and classics. Includes director Q&A sessions and networking events.",
        position: { x: 12, y: 0, z: 15 },
        color: 0xffd3b6,
        icon: "🎬"
    },
    {
        id: 7,
        name: "Christmas Market",
        date: "December 20-25, 2025",
        category: "Holiday",
        description: "Traditional holiday market with local crafts, handmade gifts, seasonal treats, mulled wine, and live festive music throughout the day.",
        position: { x: 0, y: 0, z: -15 },
        color: 0xdcedc1,
        icon: "🎄"
    },
    {
        id: 8,
        name: "New Year's Eve Party",
        date: "December 31, 2025",
        category: "Celebration",
        description: "Ring in the new year with live music, DJ performances, fireworks display at midnight, dancing, and celebration throughout the night.",
        position: { x: -8, y: 0, z: 8 },
        color: 0xb4a7d6,
        icon: "🎆"
    }
];

// Helper function to get event by ID
export function getEventById(id) {
    return eventData.find(event => event.id === id);
}

// Helper function to get events by category
export function getEventsByCategory(category) {
    return eventData.filter(event => event.category === category);
}

// Helper function to get upcoming events (sorted by date)
export function getUpcomingEvents() {
    return [...eventData].sort((a, b) => new Date(a.date) - new Date(b.date));
}