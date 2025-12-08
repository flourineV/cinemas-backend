export class PathMatcher {
  static matchesPath(path: string, pattern: string): boolean {
    // Exact match
    if (path === pattern) {
      return true;
    }

    // Wildcard pattern: /prefix/**
    if (pattern.endsWith("/**")) {
      const prefix = pattern.substring(0, pattern.length - 3);
      return path.startsWith(prefix);
    }

    // Wildcard pattern: **/suffix
    if (pattern.startsWith("**/")) {
      const suffix = pattern.substring(3);
      return path.endsWith(suffix) || path.includes(`/${suffix}`);
    }

    // Single level wildcard: /prefix/*
    if (pattern.endsWith("/*")) {
      const prefix = pattern.substring(0, pattern.length - 1);
      if (path.startsWith(prefix) && path.length > prefix.length) {
        const remaining = path.substring(prefix.length);
        return !remaining.includes("/");
      }
      return false;
    }

    // UUID pattern: /prefix/{uuid}
    if (pattern.includes("/{uuid}")) {
      const regex = pattern.replace(
        "/{uuid}",
        "/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
      );
      return new RegExp(`^${regex}$`).test(path);
    }

    // Middle wildcard: /prefix/*/suffix
    if (pattern.includes("/*/")) {
      const parts = pattern.split("/*/");
      if (parts.length === 2) {
        const [prefix, suffix] = parts;
        if (path.startsWith(prefix + "/") && path.endsWith("/" + suffix)) {
          const middle = path.substring(
            prefix.length + 1,
            path.length - suffix.length - 1
          );
          return !middle.includes("/") && /^[0-9a-f-]+$/.test(middle);
        }
      }
      return false;
    }

    return false;
  }

  /**
   * Check if path should be excluded based on exclude patterns
   */
  static isExcluded(path: string, excludePaths?: string[]): boolean {
    if (!excludePaths || excludePaths.length === 0) {
      return false;
    }

    return excludePaths.some((pattern) => this.matchesPath(path, pattern));
  }
}
