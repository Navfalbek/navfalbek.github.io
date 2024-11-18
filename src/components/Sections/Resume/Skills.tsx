import {FC, memo, PropsWithChildren } from 'react';

import {Skill as SkillType, SkillGroup as SkillGroupType} from '../../../data/dataDef';

export const SkillGroup: FC<PropsWithChildren<{ skillGroup: SkillGroupType }>> = memo(
  ({ skillGroup }) => {
    const { text } = skillGroup;
    return <div className="flex flex-col">{text}</div>;
  }
);

SkillGroup.displayName = 'SkillGroup';

export const Skill: FC<{skill: SkillType}> = memo(({skill}) => {
  const {text} = skill;

  return (
    <div className="flex flex-col">
      <span className="ml-2 text-sm font-medium">{text}</span>
    </div>
  );
});

Skill.displayName = 'Skill';
