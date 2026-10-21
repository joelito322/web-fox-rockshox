/** Offline builders for new GLB resources. Published v1–v8 are never rebuilt here. */
import * as T from "three";
import { lettering } from "./decals";
import profiles from "./frame-profiles.json";
import { SpatialMeshBuilder } from "../../src/features/configurator/scene/generators/v4/mesh";
import { dark, metal, mix, point } from "../../src/features/configurator/scene/generators/v3/mesh";
import type { Point } from "../../src/features/configurator/model/assembly";

type Variant = { specs: Record<string, any>; allowed_finishes: { options: { material: { color: string } }[] } };
type Profile = typeof profiles[keyof typeof profiles];
const vector = (p: Point) => new T.Vector3(...p);
const mm = (n: number) => n / 1000;
const anchor = (position: Point, estimated = true) => ({ position, rotation: [0, 0, 0] as Point, estimated });
function sleeve(b: SpatialMeshBuilder, from: Point, to: Point, outer: number, inner: number, color: string) {
  const shape = new T.Shape(); shape.absarc(0, 0, outer, 0, Math.PI * 2, false);
  const hole = new T.Path(); hole.absarc(0, 0, inner, 0, Math.PI * 2, true); shape.holes.push(hole);
  const length = vector(to).distanceTo(vector(from));
  const g = new T.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false, curveSegments: 24 });
  g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 0, 1), vector(to).sub(vector(from)).normalize()));
  g.translate(...from); b.add(g, color);
}
function loft(b: SpatialMeshBuilder, path: Point[], heights: number[], width: number, color: string) {
  // A smoothly bent envelope follows this model's independent photographic centerline.
  const curve = new T.CatmullRomCurve3(path.map(vector), false, "centripetal");
  const count = Math.max(8, path.length * 5), pts: Point[] = [], sections: [number, number][] = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count, f = t * (heights.length - 1), index = Math.min(heights.length - 2, Math.floor(f));
    pts.push(curve.getPoint(t).toArray() as Point);
    sections.push([mm(heights[index] + (heights[index + 1] - heights[index]) * (f - index)), mm(width)]);
  }
  b.loft(pts, sections, color);
}
function frame(slug: keyof typeof profiles, variant: Variant) {
  const profile: Profile = profiles[slug], specs = variant.specs;
  const estimated = { ...profile.estimated_geometry };
  if (specs.size_label === "L" && !specs.geometry) { estimated.reach_mm += 25; estimated.stack_mm += 8; }
  const geo = { ...estimated, ...specs.geometry }, p = profile.image_landmarks;
  const bb = p.bottom_bracket, headImage = p.head_top, rearImage = p.rear_axle;
  const h: Point = [mm(geo.reach_mm), mm(geo.stack_mm), 0];
  const drop = mm(geo.bb_drop_mm ?? (specs.wheel_rear === "29" ? 25 : 0));
  const rear: Point = [-Math.sqrt(mm(geo.chainstay_mm) ** 2 - drop ** 2), drop, 0];
  const u = [headImage[0] - bb[0], bb[1] - headImage[1]], v = [rearImage[0] - bb[0], bb[1] - rearImage[1]];
  const determinant = u[0] * v[1] - v[0] * u[1];
  const xy = (pixel: number[], z = 0): Point => {
    const x = pixel[0] - bb[0], y = bb[1] - pixel[1];
    const a = (x * v[1] - v[0] * y) / determinant, c = (u[0] * y - x * u[1]) / determinant;
    return [a * h[0] + c * rear[0], a * h[1] + c * rear[1], z];
  };
  const angle = geo.head_angle_deg * Math.PI / 180, length = mm(geo.head_tube_mm);
  const lower: Point = [h[0] + Math.cos(angle) * length, h[1] - Math.sin(angle) * length, 0];
  const seat = xy(p.seat_top), pivot = xy(p.pivot), upper = xy(p.shock_upper), rawLower = xy(p.shock_lower);
  const direction = vector(rawLower).sub(vector(upper)).normalize();
  const shockLower = vector(upper).addScaledVector(direction, mm(specs.shock_fit?.eye_to_eye_mm ?? 250)).toArray() as Point;
  const color = variant.allowed_finishes.options[0].material.color, b = new SpatialMeshBuilder();
  const paths: Point[][] = [];
  for (const member of profile.members) {
    const path = member.path.map(pixel => xy(pixel));
    if (member.name === "downtube") { path[0] = [0, 0, 0]; path[path.length - 1] = lower; }
    if (member.name === "top_tube") path[path.length - 1] = h;
    if (member.name === "seat_tube") { path[0] = [0, 0, 0]; path[path.length - 1] = seat; }
    paths.push(path);
    for (const side of member.paired ? [-1, 1] : [0]) {
      const local = path.map(at => {
        const factor = Math.min(1, Math.max(0, at[0] / rear[0]));
        return point(at, side * (0.044 + (mm(profile.axle_width_mm) / 2 + .008 - .044) * factor));
      });
      loft(b, local, member.height_mm, member.width_mm, color);
      if (side) {
        const root = local[local.length - 1];
        // Physical clevis roots close both sides; axle and pivot bolts are separate bodies.
        b.tube(point(root, -.045), point(root, .045), .012, dark);
      }
    }
  }
  sleeve(b, lower, h, .034, .026, color);
  const seatDir = vector(seat).sub(vector(xy(profile.members.find(m => m.name === "seat_tube" || m.name === "seat_bridge")!.path.slice(-2)[0]))).normalize();
  sleeve(b, vector(seat).addScaledVector(seatDir, -.032).toArray() as Point, seat, .019, mm((specs.seatpost_diameter_mm ?? 31.6) / 2), color);
  const bbWidth = mm(specs.bb_shell?.width_mm ?? 83);
  sleeve(b, [0, 0, -bbWidth / 2], [0, 0, bbWidth / 2], .026, .0205, color);
  for (const link of profile.links) {
    const path = link.map(pixel => xy(pixel));
    for (const side of [-1, 1]) {
      for (let i = 0; i < path.length - 1; i++) loft(b, [point(path[i], side * .044), point(path[i + 1], side * .044)], [17, 17], 8, dark);
      if (path.length > 2) loft(b, [point(path[path.length - 1], side * .044), point(path[0], side * .044)], [16, 16], 8, dark);
      for (const at of path) { b.disc(point(at, side * .054), .011, .004, .004, metal); b.tube(point(at, -.052), point(at, .052), .004, dark); }
    }
  }
  // Separate mounting ears, linked to the nearest fixed frame/link location instead of floating.
  const supports = [...paths.flat(), ...profile.links.flat().map(pixel => xy(pixel))];
  for (const eye of [upper, shockLower]) {
    const parent = supports.reduce((best, at) => vector(at).distanceTo(vector(eye)) < vector(best).distanceTo(vector(eye)) ? at : best);
    for (const side of [-1, 1]) {
      loft(b, [point(parent, side * .035), point(eye, side * .019)], [11, 12], 7, color);
      sleeve(b, point(eye, side < 0 ? -.026 : .014), point(eye, side < 0 ? -.014 : .026), .012, .004, color);
    }
    b.tube(point(eye, -.031), point(eye, .031), .004, metal);
  }
  for (const side of [-1, 1]) {
    sleeve(b, point(rear, side * (mm(profile.axle_width_mm) / 2)), point(rear, side * (mm(profile.axle_width_mm) / 2 + .016)), .016, .006, color);
  }
  // Axle bridge, left brake bosses and drive-side hanger are intentionally asymmetric.
  b.tube(point(rear, -.09), point(rear, .09), .006, metal);
  for (const delta of [.055, .09]) b.tube([rear[0] + delta, rear[1] + .04, -.074], [rear[0] + delta, rear[1] + .06, -.074], .007, dark);
  loft(b, [[rear[0], rear[1], .087], [rear[0] + .012, rear[1] - .041, .087]], [9, 7], 5, dark);
  const idlerPixel = "idler" in profile ? profile.idler : null;
  const idler = idlerPixel ? xy(idlerPixel as number[]) : null;
  if (idler) {
    b.tube(point(idler, .026), point(idler, .072), .006, metal);
    b.disc(point(idler, .068), .028, .004, .009, dark, 18);
    b.disc(point(idler, .075), .010, .003, .004, metal);
    loft(b, [point(pivot, .040), point(idler, .040)], [14, 12], 8, dark);
  }
  const down = paths[0];
  loft(b, [point(down[1], -.031), point(down[2], -.032), point(mix(down[2], down[3], .45), -.032)], [8, 8, 7], 3, dark);
  const frontRadius = specs.wheel_front === "27.5" ? .352 : .37, rearRadius = specs.wheel_rear === "29" ? .37 : .352;
  const front: Point = [rear[0] + mm(geo.wheelbase_mm ?? (geo.reach_mm + 800)), rear[1] + frontRadius - rearRadius, 0];
  const anchors = {
    rear_axle: anchor(rear), front_axle: anchor(front), head_tube: anchor(h), head_tube_lower: anchor(lower),
    seat_tube: anchor(seat), saddle: anchor([seat[0] - .024, seat[1] + .14, 0]),
    shock_upper: anchor(upper), shock_lower: anchor(shockLower), suspension_pivot: anchor(pivot),
    ...(idler ? { chain_idler: anchor(idler) } : {}),
  };
  const brand = slug.startsWith("santa-cruz") ? "SANTA CRUZ" : slug.startsWith("gt-") ? "GT" : slug.startsWith("commencal") ? "COMMENCAL" : "YT";
  const labelStart = mix(down[1], down[2], .3), labelEnd = mix(down[2], down[3], .7);
  return { surfaces: b.finish(), anchors, color, label: { text: brand, start: labelStart, end: labelEnd, z: mm(profile.members[0].width_mm) + .001, color: slug.startsWith("commencal") ? "#252929" : "#e8e7de" } };
}
function fork(slug: string, variant: Variant) {
  const s = variant.specs, bomber = slug === "marzocchi-bomber-58", ohlins = slug === "ohlins-dh38-m2";
  const length = mm(s.axle_to_crown_mm ?? 581), offset = mm(s.offset_mm), radius = mm(s.stanchion_diameter_mm) / 2;
  const b = new SpatialMeshBuilder(), color = variant.allowed_finishes.options[0].material.color;
  const spacing = bomber ? .068 : ohlins ? .065 : .064;
  const axle: Point = [offset, -length, 0], upperCrown: Point = [0, .145, 0];
  const sealY = -.226, archY = -length + (s.wheel_bsd_mm / 2 + 73) / 1000;
  sleeve(b, [0, -.013, 0], [0, .188, 0], .0142875, .0105, metal);
  for (const y of [0, upperCrown[1]]) {
    sleeve(b, [0, y - .014, 0], [0, y + .014, 0], .023, .0143, dark);
    for (const side of [-1, 1]) {
      const z = side * spacing;
      sleeve(b, [offset, y - .017, z], [offset, y + .017, z], radius + .005, radius, dark);
      b.loft([[0, y, 0], [offset * .65, y, z * .55], [offset, y, z]], [[.015, .022], [.012, .023], [.016, .025]], dark);
      for (const dy of [-.008, .008]) b.tube([offset + .023, y + dy, z - .006], [offset + .023, y + dy, z + .006], .0035, metal, .0035, 6);
    }
  }
  for (const side of [-1, 1]) {
    const z = side * spacing;
    b.tube([offset, -.245, z], [offset, .17, z], radius, "#171c1f", radius, 32);
    b.tube([offset, sealY - .016, z], [offset, sealY + .005, z], radius + .006, "#141819", radius + .006, 24);
    loft(b, [[offset, sealY - .014, z], [offset, sealY - .15, z], [offset, -length + .06, z], [offset, -length, z]], [radius * 1000 + 8, radius * 1000 + 6, 23, 23], 25, color);
    sleeve(b, [offset, -length, z - .018], [offset, -length, z + .018], .021, .010, color);
    // Rib follows the rear face into the axle foot rather than ending in space.
    loft(b, [[offset - .024, sealY - .024, z], [offset - .024, -length + .04, z], [offset, -length, z]], [7, 8, 8], 9, color);
    b.tube([offset, .17, z], [offset, .178, z], radius + .001, side < 0 ? (ohlins ? "#ddbd1a" : "#2875ac") : dark);
    b.tube([offset, -length - .018, z], [offset, -length - .026, z], .006, side < 0 ? "#a51b21" : dark);
    b.tube([offset, .028, z], [offset, .060, z], radius + .004, "#252a2c");
  }
  // Model-specific full-volume arch, not a flat strip. Leaves tyre clearance in front view.
  const archX = offset + (bomber ? .025 : ohlins ? .032 : .028);
  b.loft([[offset, sealY - .016, -spacing], [archX, archY - .018, -.043], [archX, archY, -.026], [archX, archY + (bomber ? -.002 : .004), .026], [archX, archY - .018, .043], [offset, sealY - .016, spacing]], [[.015, .017], [.014, .015], [.013, .014], [.013, .014], [.014, .015], [.015, .017]], color);
  b.tube(point(axle, -.084), point(axle, .084), .010, "#343b3e", .010, 24);
  // Brake mounts only on the disc side. No mirrored caliper bosses.
  for (const dy of [.055, .095]) {
    const root: Point = [offset - .01, -length + dy, -.064];
    b.tube(root, [offset - .034, -length + dy, -.077], .008, color);
    b.tube([offset - .034, -length + dy - .009, -.077], [offset - .034, -length + dy + .009, -.077], .005, metal);
  }
  return { surfaces: b.finish(), color, anchors: { lower_crown: anchor([0, 0, 0]), upper_crown: anchor(upperCrown), axle: anchor(axle, s.axle_to_crown_mm == null) } };
}
export function buildGravityResource(slug: string, variant: Variant) {
  if (slug in profiles) return frame(slug as keyof typeof profiles, variant);
  if (!["rockshox-boxxer-ultimate-d2", "rockshox-boxxer-select-d2", "marzocchi-bomber-58", "ohlins-dh38-m2"].includes(slug)) throw Error("unknown_gravity_profile");
  return fork(slug, variant);
}
export function gravityGroup(slug: string, variant: Variant) {
  const resource = buildGravityResource(slug, variant), group = new T.Group();
  let paintIndex = 0, detailIndex = 0;
  for (const surface of resource.surfaces) {
    const mesh = new T.Mesh(surface.geometry, new T.MeshStandardMaterial({ color: surface.color, roughness: surface.roughness, metalness: surface.metalness }));
    mesh.name = surface.color === resource.color ? `${slug}__paint_${paintIndex++}` : `${slug}__detail_${detailIndex++}`;
    mesh.castShadow = true; group.add(mesh);
  }
  if (typeof document !== "undefined") {
    if ("label" in resource) {
      const label = resource.label;
      for (const side of [-1, 1]) {
        const center = mix(label.start, label.end, .5), width = vector(label.start).distanceTo(vector(label.end));
        const decal = lettering(label.text, label.color, width, .025);
        decal.position.set(center[0], center[1], side * label.z);
        decal.rotation.z = Math.atan2(label.end[1]-label.start[1],label.end[0]-label.start[0]);
        if(side<0)decal.rotateY(Math.PI);
        decal.name=slug+"__lettering_"+side;group.add(decal);
      }
    } else {
      const length = Number(variant.specs.axle_to_crown_mm ?? 581)/1000, offset=Number(variant.specs.offset_mm)/1000;
      const text = slug.startsWith("ohlins") ? "ÖHLINS" : slug.startsWith("marzocchi") ? "BOMBER 58" : "BoXXer";
      const tint = slug.startsWith("ohlins") ? "#f3d321" : slug.includes("select") ? "#858b8b" : "#f2f1e8";
      const spacing = slug.startsWith("marzocchi") ? .068 : slug.startsWith("ohlins") ? .065 : .064;
      for(const side of [-1,1]){
        const decal=lettering(text,tint,.148,.025);decal.position.set(offset+.029,-length+.18,side*spacing);
        decal.rotation.set(0,Math.PI/2,Math.PI/2);decal.name=slug+"__lettering_"+side;group.add(decal);
      }
    }
  }
  for(const [key,value] of Object.entries(resource.anchors)){
    const marker=new T.Object3D();marker.name="mount_"+key;marker.position.fromArray(value.position);group.add(marker);
  }
  return { group, anchors: resource.anchors, paintable_nodes: group.children.filter(n => n.name.includes("__paint_")).map(n => n.name) };
}
