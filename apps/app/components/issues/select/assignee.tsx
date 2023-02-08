import { useState, FC, Fragment } from "react";

import Image from "next/image";
import { useRouter } from "next/router";

import useSWR from "swr";

// headless ui
import { Transition, Combobox } from "@headlessui/react";
// icons
import { UserIcon } from "@heroicons/react/24/outline";
// service
import projectServices from "services/project.service";
// types
import type { IProjectMember } from "types";
// fetch keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

export type IssueAssigneeSelectProps = {
  projectId: string;
  value: string[];
  onChange: (value: string[]) => void;
};

type AssigneeAvatarProps = {
  user: IProjectMember | undefined;
};

export const AssigneeAvatar: FC<AssigneeAvatarProps> = ({ user }) => {
  if (!user) return <></>;

  if (user.member.avatar && user.member.avatar !== "") {
    return (
      <div className="relative h-4 w-4">
        <Image
          src={user.member.avatar}
          alt="avatar"
          className="rounded-full"
          layout="fill"
          objectFit="cover"
        />
      </div>
    );
  } else
    return (
      <div className="grid h-4 w-4 flex-shrink-0 place-items-center rounded-full bg-gray-700 capitalize text-white">
        {user.member.first_name && user.member.first_name !== ""
          ? user.member.first_name.charAt(0)
          : user.member.email.charAt(0)}
      </div>
    );
};

export const IssueAssigneeSelect: FC<IssueAssigneeSelectProps> = ({
  projectId,
  value = [],
  onChange,
}) => {
  // states
  const [query, setQuery] = useState("");

  const router = useRouter();
  const { workspaceSlug } = router.query;

  // fetching project members
  const { data: people } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectServices.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  const options = people?.map((person) => ({
    value: person.member.id,
    display:
      person.member.first_name && person.member.first_name !== ""
        ? person.member.first_name
        : person.member.email,
  }));

  const filteredOptions =
    query === ""
      ? options
      : options?.filter((option) => option.display.toLowerCase().includes(query.toLowerCase()));

  return (
    <Combobox
      as="div"
      value={value}
      onChange={(val) => onChange(val)}
      className="relative flex-shrink-0"
      multiple
    >
      {({ open }: any) => (
        <>
          <Combobox.Label className="sr-only">Assignees</Combobox.Label>
          <Combobox.Button
            className={`flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
          >
            <UserIcon className="h-3 w-3 text-gray-500" />
            <span
              className={`hidden truncate sm:block ${
                value === null || value === undefined ? "" : "text-gray-900"
              }`}
            >
              {Array.isArray(value)
                ? value
                    .map((v) => options?.find((option) => option.value === v)?.display)
                    .join(", ") || "Assignees"
                : options?.find((option) => option.value === value)?.display || "Assignees"}
            </span>
          </Combobox.Button>

          <Transition
            show={open}
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Combobox.Options
              className={`absolute z-10 mt-1 max-h-32 min-w-[8rem] overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-xs`}
            >
              <Combobox.Input
                className="w-full border-b bg-transparent p-2 text-xs focus:outline-none"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                displayValue={(assigned: any) => assigned?.name}
              />
              <div className="py-1">
                {filteredOptions ? (
                  filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
                      <Combobox.Option
                        key={option.value}
                        className={({ active, selected }) =>
                          `${active ? "bg-indigo-50" : ""} ${
                            selected ? "bg-indigo-50 font-medium" : ""
                          } flex cursor-pointer select-none items-center gap-2 truncate p-2 text-gray-900`
                        }
                        value={option.value}
                      >
                        {people && (
                          <>
                            <AssigneeAvatar
                              user={people?.find((p) => p.member.id === option.value)}
                            />
                            {option.display}
                          </>
                        )}
                      </Combobox.Option>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 px-2">No assignees found</p>
                  )
                ) : (
                  <p className="text-xs text-gray-500 px-2">Loading...</p>
                )}
              </div>
            </Combobox.Options>
          </Transition>
        </>
      )}
    </Combobox>
  );
};