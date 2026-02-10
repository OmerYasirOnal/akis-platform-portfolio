
import { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { githubDiscoveryApi } from '../../services/api/github-discovery';
import type { GitHubOwner, GitHubRepo } from '../../services/api/github-discovery';

interface RepoSidebarProps {
    className?: string;
    onSelectRepo: (owner: string, repo: string) => void;
    selectedRepo?: { owner: string; name: string };
}

export function RepoSidebar({ className, onSelectRepo, selectedRepo }: RepoSidebarProps) {
    const [owners, setOwners] = useState<GitHubOwner[]>([]);
    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                setError(null);
                const { owners } = await githubDiscoveryApi.getOwners();
                setOwners(owners);

                if (owners.length > 0) {
                    // Fetch repos for the first owner by default
                    const { repos } = await githubDiscoveryApi.getRepos(owners[0].login);
                    setRepos(repos);
                }
            } catch (err: unknown) {
                console.error('Failed to fetch github data:', err);
                const errorMessage = err instanceof Error ? err.message : 'Failed to connect to GitHub. Please check your integration.';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const filteredRepos = repos.filter(repo =>
        repo.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between px-2">
                <h2 className="text-sm font-semibold text-ak-text-primary">Top Repositories</h2>
                <button className="rounded px-2 py-1 text-xs text-ak-text-primary bg-ak-surface hover:bg-ak-surface-2 transition-colors">
                    New
                </button>
            </div>

            <div className="relative">
                <input
                    type="text"
                    placeholder="Find a repository..."
                    className="w-full rounded-md border border-ak-border bg-ak-bg px-3 py-1.5 text-sm text-ak-text-primary placeholder-ak-text-secondary focus:border-ak-primary focus:outline-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="min-h-[200px]">
                {loading && (
                    <div className="flex items-center justify-center p-8">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-ak-primary border-t-transparent" />
                    </div>
                )}

                {error && (
                    <div className="p-4 text-xs text-ak-danger bg-ak-danger/10 rounded-lg border border-ak-danger/20">
                        {error}
                    </div>
                )}

                {!loading && !error && filteredRepos.length === 0 && (
                    <div className="p-8 text-center text-xs text-ak-text-secondary italic">
                        No repositories found.
                    </div>
                )}

                <ul className="space-y-1">
                    {filteredRepos.map(repo => {
                        const isSelected = selectedRepo?.owner === owners[0]?.login && selectedRepo?.name === repo.name;
                        return (
                            <li key={repo.fullName}>
                                <button
                                    onClick={() => onSelectRepo(owners[0].login, repo.name)}
                                    className={cn(
                                        "group w-full text-left flex gap-2 items-center rounded-md px-2 py-2 transition-colors",
                                        isSelected ? "bg-ak-surface-2 border border-ak-primary/30" : "hover:bg-ak-surface-2"
                                    )}
                                >
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-ak-surface border border-ak-border">
                                        <span className="text-xs text-ak-text-secondary">📚</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className={cn(
                                            "truncate text-sm font-medium transition-colors",
                                            isSelected ? "text-ak-primary" : "text-ak-text-primary group-hover:text-ak-primary"
                                        )}>
                                            {repo.name}
                                        </div>
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>

            <div className="pt-4 border-t border-ak-border px-2">
                <h3 className="text-xs font-semibold text-ak-text-secondary mb-2">Recent activity</h3>
                <div className="text-xs text-ak-text-secondary italic">No recent activity</div>
            </div>
        </div>
    );
}
