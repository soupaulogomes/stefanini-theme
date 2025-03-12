# frozen_string_literal: true
module ThemeCheck
  class SchemaTranslationKeyExists < LiquidCheck
    DEFAULT_LOCALE_REGEXP = %r{locales/(.*)\.schema}

    severity :error
    category :translation
    doc docs_url(__FILE__)

    def initialize
      @all_used_translations = {}
      @schema_files = []
      @theme_files = {}
    end

    def on_schema(node)
      used_translation = []

      node.outer_markup.each_line.with_index do |line, index|
        matches = line.scan(/t:([^"]+)/).flatten
        if matches.any?
          match_line = index + node.line_number
          my_hash = {}
          my_hash["match_line"] = match_line
          my_hash["matches"] = matches.first
          used_translation << my_hash
        end
      end

      @all_used_translations[node.theme_file.name] = used_translation
      @theme_files[node.theme_file.name] = node.theme_file
    end

    def on_end
      default_locale_json
      @all_used_translations.each_pair do |file_name, used_translations|
        used_translations.each do |used_translation|
          next unless used_translation["matches"].is_a?(String)
          @schema_files.each do |schema_file|
            next if key_exists?(used_translation["matches"], schema_file.content)
            add_offense(
              "'#{used_translation["matches"]}' does not have a matching entry or is not a String in '#{schema_file.name}.json'",
              theme_file: @theme_files[file_name],
              line_number: used_translation["match_line"],
            )
          end
        end
      end
    end

    private

    def key_exists?(key, pointer)
      key.split(".").each do |token|
        return false unless pointer.is_a?(Hash)
        return false unless pointer.key?(token)
        pointer = pointer[token]
      end
      return false unless pointer.is_a?(String)
      true
    end

    def default_locale_json
      @theme.json.each do |json_file|
        if json_file.name.match?(DEFAULT_LOCALE_REGEXP)
          @schema_files << json_file
        end
      end
    end
  end
end

