import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

const Service = (props: {
  clusterId: string;
  name: string;
  functions?: Array<{ name: string }>;
}) => {
  return (
    <Link
      href={`/clusters/${props.clusterId}/services/${props.name}`}
      className="mr-4 mb-4 w-96"
    >
      <Card className="w-[350px] mr-4 mb-4 h-full shadow-sm shadow-green-600 hover:bg-slate-900 duration-200">
        <CardHeader>
          <p className="text-sm text-gray-500 -mb-1">service</p>
          <CardTitle>{props.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">functions</p>
          <ul>
            {props.functions?.map((fn) => (
              <li className="font-mono" key={fn.name}>
                {fn.name}()
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </Link>
  );
};

export const ServiceSummary = (props: {
  clusterId: string;
  services: Array<{ name: string; functions?: Array<{ name: string }> }>;
}) => {
  return (
    <div className="flex">
      {props.services.map((s) => (
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
