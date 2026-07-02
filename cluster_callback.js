function embassyCallback(row) {
    return L.circleMarker([row[0], row[1]], {
        radius: 12,
        color: 'white',
        weight: 2,
        fillColor: row[3],
        fillOpacity: 1
    }).bindTooltip(row[2]);
}
