function typesFromClasses(input) {
	return Object.fromEntries(Object.entries(input).flatMap(([k, v]) => v.map(s => [s, k])));
}

export const layerClasses = {
	"MapLayer": ["floor", "wall", "segment"],
};

export const entityClasses = {
	"LineMapEntity": ["virtual_wall"],
	"PathMapEntity": ["path", "predicted_path"],
	"PointMapEntity": ["charger_location", "robot_position", "go_to_target", "obstacle"],
	"PolygonMapEntity": ["active_zone", "no_go_area", "no_mop_area"],
};

export const layerTypes = typesFromClasses(layerClasses);
export const entityTypes = typesFromClasses(entityClasses);
