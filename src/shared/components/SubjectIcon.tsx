import { createElement } from 'react';
import { getSubjectIcon, type SubjectIconProps } from '@/shared/data/subjectIcons';

/**
 * Renders the phosphor icon configured for a subject.
 * Looking the icon up inside a component body reads as "creating a component
 * during render", so the lookup is isolated here.
 */
export default function SubjectIcon({
    name,
    size = 22,
    color = '#94a3b8',
    weight = 'duotone',
}: SubjectIconProps) {
    return createElement(getSubjectIcon(name), { size, color, weight });
}
