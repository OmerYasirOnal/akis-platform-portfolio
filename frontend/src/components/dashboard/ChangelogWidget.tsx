
import { cn } from '../../utils/cn';
import Card from '../common/Card';

const UPDATES = [
    { id: 1, title: 'Scribe v2.1 Released', date: '2h ago', type: 'release' },
    { id: 2, title: 'New Trace Analytics', date: '5h ago', type: 'feature' },
    { id: 3, title: 'Scheduled Maintenance', date: '1d ago', type: 'alert' },
];

export function ChangelogWidget({ className }: { className?: string }) {
    return (
        <div className={cn("space-y-4", className)}>
            <h2 className="text-sm font-semibold text-ak-text-primary px-1">Latest Updates</h2>
            <Card className="p-0 bg-transparent border-none shadow-none hover:transform-none">
                <ul className="space-y-3">
                    {UPDATES.map(update => (
                        <li key={update.id} className="relative pl-4 border-l-2 border-ak-border hover:border-ak-primary transition-colors">
                            <div className="text-xs text-ak-text-secondary mb-0.5">{update.date}</div>
                            <div className="text-sm font-medium text-ak-text-primary hover:text-ak-primary cursor-pointer transition-colors">
                                {update.title}
                            </div>
                        </li>
                    ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-ak-border">
                    <a href="#" className="text-xs text-ak-primary hover:underline">View full changelog →</a>
                </div>
            </Card>

            <div className="bg-ak-surface-2/50 rounded-xl p-4 border border-ak-border">
                <h3 className="text-xs font-semibold text-ak-text-primary mb-2">Did you know?</h3>
                <p className="text-xs text-ak-text-secondary leading-relaxed">
                    You can ask Scribe to review your PRs automatically by tagging @scribe-bot in your comments.
                </p>
            </div>
        </div>
    );
}
