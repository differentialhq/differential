import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { SmallLiveGreenCircle } from "../helpers";

const Service = (props: {
  clusterId: string;
  name: string;
  functions?: Array<{ name: string }>;
  activeFunctions?: Array<{ name: string }>;
}) => {
  return (
    <Link
      href={`/clusters/${props.clusterId}/services/${props.name}`}
      className="mr-2 mb-4 w-96"
    >
      <Card className="h-full shadow-sm hover:bg-slate-900 duration-200 border border-green-700 border-t-green-500">
        <CardHeader>
          <p className="text-sm text-gray-500 -mb-1">service</p>
          <CardTitle>{props.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-2">functions</p>
          <div className="flex flex-col">
            {props.functions
              ?.sort((a, b) => (a.name < b.name ? -1 : 1))
              .map((fn) => (
                <div
                  className="flex font-mono py-1 px-2 bg-slate-900 border-slate-700 border mr-2 mb-2 rounded-md items-center justify-between"
                  key={fn.name}
                >
                  <span>{fn.name}()</span>
                  {props.activeFunctions?.find((f) => f.name === fn.name) && (
                    <span>
                      <SmallLiveGreenCircle />
                    </span>
                  )}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export const ServiceSummary = (props: {
  clusterId: string;
  services: Array<{ name: string; functions?: Array<{ name: string }> }>;
  activeFunctions?: Array<{ name: string; service: string }>;
}) => {
  return (
    <div className="flex flex-wrap">
      {props.services
        .sort((a, b) => (a.name < b.name ? -1 : 1))
        .map((s) => (
          <Service
            key={s.name}
            name={s.name}
            functions={s.functions}
            clusterId={props.clusterId}
          />
        ))}
    </div>
  );
};
