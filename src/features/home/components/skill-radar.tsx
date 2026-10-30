import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { Icon } from "@/components/ui/icon";
import { radarLabelAnchor, radarPoint, radarPolygon, radarSync, toSvgPoints, type RadarGeometry } from "@/lib/radar";
import type { RadarValue } from "@/types/player";

const geometry: RadarGeometry = { center: { x: 100, y: 80 }, radius: 70 };
const rings = [1, 0.64, 0.29];
const LABEL_RATIO = 1.12;

type SkillRadarProps = {
  dictionary: Dictionary["home"]["dossier"]["radar"];
  radar: readonly RadarValue[];
};

export function SkillRadar({ dictionary, radar }: SkillRadarProps) {
  const axisCount = radar.length;
  const outline = (ratio: number) => toSvgPoints(radar.map((_, index) => radarPoint(geometry, axisCount, index, ratio)));
  const vertices = radarPolygon(geometry, radar.map(({ value }) => value));
  const description = radar
    .map(({ axis, value }) => `${dictionary.axes[axis]}: ${Math.round(value * 100)}%`)
    .join(", ");

  return (
    <section className="flex flex-col gap-3 border-t-2 border-dashed border-surface-container-high pt-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="eyebrow">{dictionary.title}</h3>
        <span className="shrink-0 -skew-x-12 bg-secondary-fixed px-2 py-0.5 font-hud text-label-hud font-black uppercase tracking-widest text-on-secondary-fixed">
          {formatMessage(dictionary.sync, { percent: radarSync(radar) })}
        </span>
      </div>
      <div className="relative flex w-full items-center justify-center py-1">
        <div aria-hidden="true" className="halftone absolute inset-y-0 left-1/2 w-full max-w-72 -translate-x-1/2 -skew-x-12 bg-primary-container/30" />
        <svg role="img" aria-label={description} viewBox="-55 -10 310 180" className="relative h-40 w-full max-w-72">
          {rings.map((ratio, index) => (
            <polygon
              key={ratio}
              points={outline(ratio)}
              fill="none"
              strokeWidth={index === rings.length - 1 ? 1 : 1.5}
              strokeDasharray={index === 0 ? "3 3" : undefined}
              className="stroke-surface-container-highest"
            />
          ))}
          {radar.map(({ axis }, index) => {
            const end = radarPoint(geometry, axisCount, index, 1);
            return (
              <line
                key={axis}
                x1={geometry.center.x}
                y1={geometry.center.y}
                x2={end.x}
                y2={end.y}
                strokeWidth="1"
                className="stroke-surface-container-highest"
              />
            );
          })}
          <polygon
            points={toSvgPoints(vertices)}
            fillOpacity="0.45"
            strokeWidth="2.5"
            className="fill-primary-container stroke-secondary-fixed"
          />
          {vertices.map((vertex, index) => (
            <circle key={radar[index].axis} cx={vertex.x} cy={vertex.y} r="3" className="fill-secondary" />
          ))}
          {radar.map(({ axis }, index) => {
            const label = radarPoint(geometry, axisCount, index, LABEL_RATIO);
            return (
              <text
                key={axis}
                x={label.x}
                y={label.y}
                textAnchor={radarLabelAnchor(geometry, label)}
                dominantBaseline="middle"
                fontSize="9"
                fontWeight="900"
                className="fill-on-surface font-hud uppercase"
              >
                {dictionary.axes[axis]}
              </text>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

/** Shown until the player has finished a race. */
export function RadarEmpty({ dictionary }: { dictionary: SkillRadarProps["dictionary"] }) {
  return (
    <section className="flex flex-col gap-3 border-t-2 border-dashed border-surface-container-high pt-5">
      <h3 className="eyebrow">{dictionary.title}</h3>
      <p className="flex items-center gap-2 py-6 text-on-surface-variant">
        <Icon name="analytics" size={28} className="text-primary-container" />
        {dictionary.empty}
      </p>
    </section>
  );
}
